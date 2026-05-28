import { db } from "../../common/database/connection.js";
import { drives } from "../../common/database/schema/drive.js";
import { connectionConfigs } from "../../common/database/schema/connection-config.js";
import { eq, and, isNotNull } from "drizzle-orm";
import { createDriver } from "../../common/filesystem/factory.js";
import type { FileSystemEntry } from "../../common/filesystem/types.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import { log } from "../../common/tools/logger.js";

export default async function scanAllDrives() {
  const driveRows = await db
    .select({
      driveId: drives.id,
      connectionConfigId: drives.connectionConfigId,
    })
    .from(drives)
    .where(and(eq(drives.enabled, 1), isNotNull(drives.connectionConfigId)));

  log.info(`共 ${driveRows.length} 个存储节点待扫描`);

  for (const row of driveRows) {
    try {
      const configRow = await db
        .select()
        .from(connectionConfigs)
        .where(eq(connectionConfigs.id, row.connectionConfigId!))
        .limit(1);

      if (!configRow.length) {
        log.warn(`Drive ${row.driveId} 的连接配置 ${row.connectionConfigId} 不存在，跳过`);
        continue;
      }

      const driver = createDriver(configRow[0]);
      log.info(`[${row.driveId}] 开始全量扫描...`);

      const stats = await scanDirectory(driver, row.driveId, "/");
      log.info(`[${row.driveId}] 扫描完成: ${stats.total} 条 (${stats.files} 文件, ${stats.dirs} 目录, ${stats.directories} 个文件夹)`);
    } catch (err) {
      log.error(err, `扫描 Drive ${row.driveId} 失败`);
    }
  }
}

interface ScanStats {
  total: number;
  files: number;
  dirs: number;
  directories: number;
}

async function scanDirectory(
  driver: ReturnType<typeof createDriver>,
  driveId: string,
  currentPath: string
): Promise<ScanStats> {
  let entries: FileSystemEntry[];
  try {
    entries = await driver.list(currentPath);
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

  for (const entry of dirEntries) {
    const sub = await scanDirectory(driver, driveId, entry.path);
    stats.total += sub.total;
    stats.files += sub.files;
    stats.dirs += sub.dirs;
    stats.directories += sub.directories;
  }

  return stats;
}
