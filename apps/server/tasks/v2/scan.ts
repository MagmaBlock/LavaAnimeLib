import pLimit from "p-limit";
import { db } from "../../common/database/connection.js";
import { drives } from "../../common/database/schema/drive.js";
import { eq, and, isNotNull } from "drizzle-orm";
import { createDriver } from "../../common/filesystem/factory.js";
import type { FileSystemEntry } from "../../common/filesystem/types.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import { log } from "../../common/tools/logger.js";
import type { DriveConfig } from "@lavaanime/shared";

const DIR_CONCURRENCY = 4;

export default async function scanAllDrives() {
  const driveRows = await db
    .select({
      id: drives.id,
      type: drives.type,
      config: drives.config,
    })
    .from(drives)
    .where(
      and(
        eq(drives.enabled, 1),
        isNotNull(drives.type),
        isNotNull(drives.config),
      ),
    );

  log.info(`共 ${driveRows.length} 个存储节点待扫描`);

  await Promise.all(driveRows.map((row) => scanSingleDrive(row)));
}

async function scanSingleDrive(row: {
  id: string;
  type: string;
  config: unknown;
}) {
  try {
    const driver = createDriver({ type: row.type, config: row.config as DriveConfig });
    log.info(`[${row.id}] 开始全量扫描...`);

    const limit = pLimit(DIR_CONCURRENCY);
    const stats = await scanDirectory(limit, driver, row.id, "/");
    log.info(`[${row.id}] 扫描完成: ${stats.total} 条 (${stats.files} 文件, ${stats.dirs} 目录, ${stats.directories} 个文件夹)`);
  } catch (err) {
    log.error(err, `扫描 Drive ${row.id} 失败`);
  }
}

interface ScanStats {
  total: number;
  files: number;
  dirs: number;
  directories: number;
}

async function scanDirectory(
  limit: ReturnType<typeof pLimit>,
  driver: ReturnType<typeof createDriver>,
  driveId: string,
  currentPath: string
): Promise<ScanStats> {
  let entries: FileSystemEntry[];
  try {
    entries = await limit(() => driver.list(currentPath));
  } catch (err) {
    log.error(err, `列出目录失败: ${currentPath}`);
    return { total: 0, files: 0, dirs: 0, directories: 0 };
  }

  const fileEntries = entries.filter((e) => e.type === "file");
  const dirEntries = entries.filter((e) => e.type === "dir");
  log.info(`[${driveId}] ${currentPath} → ${fileEntries.length} 文件, ${dirEntries.length} 目录`);

  const currentPaths: string[] = [];

  const upsertEntries = entries.map((entry) => {
    currentPaths.push(entry.path);
    return {
      driveId,
      path: entry.path,
      name: entry.name,
      size: entry.size,
      type: entry.type,
      modified: entry.modified ? new Date(entry.modified) : null,
      sign: entry.sign ?? null,
    };
  });

  await fileIndexService.upsertEntries(upsertEntries);
  await fileIndexService.softDeleteStale(driveId, currentPath, currentPaths);

  const stats: ScanStats = { total: entries.length, files: fileEntries.length, dirs: dirEntries.length, directories: 1 };

  if (dirEntries.length > 0) {
    const subResults = await Promise.all(
      dirEntries.map((entry) =>
        scanDirectory(limit, driver, driveId, entry.path)
      )
    );
    for (const sub of subResults) {
      stats.total += sub.total;
      stats.files += sub.files;
      stats.dirs += sub.dirs;
      stats.directories += sub.directories;
    }
  }

  return stats;
}
