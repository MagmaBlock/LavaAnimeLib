import { and, asc, desc, eq, gte, like, lt, notLike, or, sql } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { fileIndex } from "../../../common/database/schema/file-index.js";
import { withDeadlockRetry } from "../../../common/database/retry.js";

const TTL_HOURS = 1;
const UPSERT_BATCH_SIZE = 500;

export interface FileIndexRecord {
  id: number;
  driveId: string;
  animeId: number | null;
  path: string;
  name: string;
  size: number;
  type: string;
  deleted: number;
  modified: Date | null;
  indexedAt: Date;
}

export interface FileIndexUpsert {
  driveId: string;
  animeId?: number | null;
  path: string;
  name: string;
  size?: number;
  type: string;
  modified?: Date | null;
}

function mapRow(row: typeof fileIndex.$inferSelect): FileIndexRecord {
  return { ...row };
}

function dirPrefix(dirPath: string): string {
  const normalized = dirPath.replace(/\/+$/, "");
  return normalized ? `${normalized}/` : "/";
}

export async function getByPath(
  driveId: string,
  dirPath: string
): Promise<FileIndexRecord[]> {
  return findActiveByDrive(driveId, dirPath);
}

export async function isCacheValid(driveId: string, dirPath: string): Promise<boolean> {
  const rows = await db
    .select({ indexedAt: fileIndex.indexedAt })
    .from(fileIndex)
    .where(
      and(
        eq(fileIndex.driveId, driveId),
        like(fileIndex.path, `${dirPrefix(dirPath)}%`),
        eq(fileIndex.deleted, 0),
      ),
    )
    .orderBy(asc(fileIndex.indexedAt))
    .limit(1);

  if (rows.length === 0) return false;

  const ttlThreshold = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);
  return rows[0].indexedAt > ttlThreshold;
}

export async function findActiveByDrive(
  driveId: string,
  dirPath: string
): Promise<FileIndexRecord[]> {
  return db
    .select()
    .from(fileIndex)
    .where(
      and(
        eq(fileIndex.driveId, driveId),
        like(fileIndex.path, `${dirPrefix(dirPath)}%`),
        eq(fileIndex.deleted, 0),
      ),
    )
    .orderBy(asc(fileIndex.type), asc(fileIndex.name))
    .then((rows) => rows.map(mapRow));
}

export async function upsertEntries(
  entries: FileIndexUpsert[]
): Promise<void> {
  for (let offset = 0; offset < entries.length; offset += UPSERT_BATCH_SIZE) {
    const batch = entries.slice(offset, offset + UPSERT_BATCH_SIZE);
    const values = batch.map((entry) => ({
      driveId: entry.driveId,
      animeId: entry.animeId ?? null,
      path: entry.path,
      name: entry.name,
      size: entry.size ?? 0,
      type: entry.type,
      modified: entry.modified ?? null,
      deleted: 0,
    }));

    await withDeadlockRetry(
      () =>
        db
          .insert(fileIndex)
          .values(values)
          .onDuplicateKeyUpdate({
            set: {
              name: sql`VALUES(\`name\`)`,
              size: sql`VALUES(\`size\`)`,
              type: sql`VALUES(\`type\`)`,
              modified: sql`VALUES(\`modified\`)`,
              deleted: 0,
              indexedAt: sql`NOW()`,
              animeId: sql`VALUES(\`anime_id\`)`,
            },
          }),
      { label: `file_index.upsert:${batch[0]?.driveId ?? "unknown"}` },
    );
  }
}

/**
 * 只处理 dirPath 的直接子项：把父目录本次列出的 currentPaths 与库中现存
 * active 直接子项对比，缺失的子项连同其整棵子树软删除。
 *
 * 不做「整棵父目录子树先删再恢复」：扫描中断时只会留下未访问到的子树，
 * 不会把已扫描成功的深层行误标为 deleted。
 */
export async function softDeleteStale(
  driveId: string,
  dirPath: string,
  currentPaths: string[]
): Promise<number> {
  const prefix = dirPrefix(dirPath);
  const current = new Set(currentPaths);

  const activeDirectChildren = await db
    .select({ path: fileIndex.path })
    .from(fileIndex)
    .where(
      and(
        eq(fileIndex.driveId, driveId),
        eq(fileIndex.deleted, 0),
        like(fileIndex.path, `${prefix}%`),
        notLike(fileIndex.path, `${prefix}%/%`),
      ),
    );

  const missingChildren = activeDirectChildren
    .map((row) => row.path)
    .filter((path) => !current.has(path));

  let affectedRows = 0;
  for (const missingPath of missingChildren) {
    const result = await withDeadlockRetry(
      () =>
        db
          .update(fileIndex)
          .set({ deleted: 1 })
          .where(
            and(
              eq(fileIndex.driveId, driveId),
              eq(fileIndex.deleted, 0),
              or(
                eq(fileIndex.path, missingPath),
                like(fileIndex.path, `${missingPath}/%`),
              ),
            ),
          ),
      { label: `file_index.softDelete:${driveId}` },
    );
    affectedRows += result[0].affectedRows;
  }

  return affectedRows;
}

export async function setAnimeId(
  driveId: string,
  dirPath: string,
  animeId: number | null
): Promise<void> {
  await db
    .update(fileIndex)
    .set({ animeId })
    .where(
      and(
        eq(fileIndex.driveId, driveId),
        like(fileIndex.path, `${dirPrefix(dirPath)}%`),
      ),
    );
}

export async function getStats(driveId: string) {
  const rows = await db
    .select({
      totalFiles: sql<number>`COUNT(CASE WHEN ${fileIndex.type} = 'file' THEN 1 END)`,
      totalDirs: sql<number>`COUNT(CASE WHEN ${fileIndex.type} = 'dir' THEN 1 END)`,
      deletedFiles: sql<number>`COUNT(CASE WHEN ${fileIndex.deleted} = 1 THEN 1 END)`,
      lastIndexedAt: fileIndex.indexedAt,
    })
    .from(fileIndex)
    .where(eq(fileIndex.driveId, driveId))
    .orderBy(asc(fileIndex.indexedAt))
    .limit(1);

  if (rows.length === 0) {
    return { totalFiles: 0, totalDirs: 0, deletedFiles: 0, lastIndexedAt: null };
  }

  return {
    totalFiles: Number(rows[0].totalFiles),
    totalDirs: Number(rows[0].totalDirs),
    deletedFiles: Number(rows[0].deletedFiles),
    lastIndexedAt: rows[0].lastIndexedAt,
  };
}

export interface ListIndexOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  parent?: string;
  sortBy?: "name" | "size" | "indexedAt" | "type";
  sortOrder?: "asc" | "desc";
  type?: "file" | "dir";
  deleted?: number;
}

export async function listIndex(
  driveId: string,
  options: ListIndexOptions = {}
): Promise<{ items: FileIndexRecord[]; total: number }> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(fileIndex.driveId, driveId)];

  if (options.parent !== undefined) {
    const parentPrefix = options.parent ? `${options.parent}/` : "/";
    conditions.push(like(fileIndex.path, `${parentPrefix}%`));
    conditions.push(sql`${fileIndex.path} NOT LIKE ${`${parentPrefix}%/%`}`);
  }

  if (options.search) {
    conditions.push(like(fileIndex.name, `%${options.search}%`));
  }

  if (options.type) {
    conditions.push(eq(fileIndex.type, options.type));
  }

  if (options.deleted !== undefined) {
    conditions.push(eq(fileIndex.deleted, options.deleted));
  }

  const sortColumn = (() => {
    switch (options.sortBy) {
      case "size": return fileIndex.size;
      case "indexedAt": return fileIndex.indexedAt;
      case "type": return fileIndex.type;
      default: return fileIndex.name;
    }
  })();
  const direction = options.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(fileIndex)
      .where(and(...conditions))
      .orderBy(direction)
      .limit(pageSize)
      .offset(offset)
      .then((rows) => rows.map(mapRow)),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(fileIndex)
      .where(and(...conditions))
      .then((rows) => Number(rows[0].count)),
  ]);

  return { items, total: countResult };
}

export async function touchIndexedAt(
  driveId: string,
  dirPath: string
): Promise<void> {
  await db
    .update(fileIndex)
    .set({ indexedAt: sql`NOW()` })
    .where(
      and(
        eq(fileIndex.driveId, driveId),
        like(fileIndex.path, `${dirPrefix(dirPath)}%`),
      ),
    );
}
