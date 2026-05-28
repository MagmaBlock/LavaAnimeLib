import { and, asc, desc, eq, gte, like, lt, sql } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { fileIndex } from "../../../common/database/schema/file-index.js";

const TTL_HOURS = 1;

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
  sign: string | null;
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
  sign?: string | null;
}

function mapRow(row: typeof fileIndex.$inferSelect): FileIndexRecord {
  return { ...row };
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
        like(fileIndex.path, `${dirPath}/%`),
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
        like(fileIndex.path, `${dirPath}/%`),
        eq(fileIndex.deleted, 0),
      ),
    )
    .orderBy(asc(fileIndex.type), asc(fileIndex.name))
    .then((rows) => rows.map(mapRow));
}

export async function upsertEntries(
  entries: FileIndexUpsert[]
): Promise<void> {
  for (const entry of entries) {
    const existing = await db
      .select({ id: fileIndex.id, deleted: fileIndex.deleted })
      .from(fileIndex)
      .where(
        and(
          eq(fileIndex.driveId, entry.driveId),
          eq(fileIndex.path, entry.path),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(fileIndex)
        .set({
          name: entry.name,
          size: entry.size ?? 0,
          type: entry.type,
          modified: entry.modified ?? null,
          sign: entry.sign ?? null,
          deleted: 0,
          indexedAt: sql`NOW()`,
          animeId: entry.animeId ?? null,
        })
        .where(eq(fileIndex.id, existing[0].id));
    } else {
      await db.insert(fileIndex).values({
        driveId: entry.driveId,
        animeId: entry.animeId ?? null,
        path: entry.path,
        name: entry.name,
        size: entry.size ?? 0,
        type: entry.type,
        modified: entry.modified ?? null,
        sign: entry.sign ?? null,
        deleted: 0,
        indexedAt: sql`NOW()`,
      });
    }
  }
}

export async function softDeleteStale(
  driveId: string,
  dirPath: string,
  currentPaths: string[]
): Promise<number> {
  if (currentPaths.length === 0) {
    const result = await db
      .update(fileIndex)
      .set({ deleted: 1 })
      .where(
        and(
          eq(fileIndex.driveId, driveId),
          like(fileIndex.path, `${dirPath}/%`),
          eq(fileIndex.deleted, 0),
        ),
      );
    return result[0].affectedRows;
  }

  const result = await db
    .update(fileIndex)
    .set({ deleted: 1 })
    .where(
      and(
        eq(fileIndex.driveId, driveId),
        like(fileIndex.path, `${dirPath}/%`),
        eq(fileIndex.deleted, 0),
      ),
    );

  for (const path of currentPaths) {
    await db
      .update(fileIndex)
      .set({ deleted: 0, indexedAt: sql`NOW()` })
      .where(
        and(
          eq(fileIndex.driveId, driveId),
          eq(fileIndex.path, path),
        ),
      );
  }

  return result[0].affectedRows;
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
        like(fileIndex.path, `${dirPath}/%`),
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
    const parentPrefix = options.parent ? `${options.parent}/` : "";
    if (parentPrefix) {
      conditions.push(like(fileIndex.path, `${parentPrefix}%`));
      conditions.push(sql`${fileIndex.path} NOT LIKE ${`${parentPrefix}%/%`}`);
    } else {
      conditions.push(sql`${fileIndex.path} NOT LIKE ${`%/%`}`);
    }
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
        like(fileIndex.path, `${dirPath}/%`),
      ),
    );
}
