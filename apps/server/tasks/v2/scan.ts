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
      log.info(`开始扫描 Drive: ${row.driveId}`);

      await scanDirectory(driver, row.driveId, "/");
      log.info(`Drive ${row.driveId} 扫描完成`);
    } catch (err) {
      log.error(err, `扫描 Drive ${row.driveId} 失败`);
    }
  }
}

async function scanDirectory(
  driver: ReturnType<typeof createDriver>,
  driveId: string,
  currentPath: string
): Promise<void> {
  let entries: FileSystemEntry[];
  try {
    entries = await driver.list(currentPath);
  } catch (err) {
    log.error(err, `列出目录失败: ${currentPath}`);
    return;
  }

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

  for (const entry of entries) {
    if (entry.type === "dir") {
      await scanDirectory(driver, driveId, entry.path);
    }
  }
}
