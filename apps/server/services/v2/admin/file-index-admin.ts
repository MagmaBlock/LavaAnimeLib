import type { FileSystemDriver } from "../../../common/filesystem/types.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getConnectionConfigById } from "./connection-config.js";
import { getDrive } from "../drive/index.js";
import type { ListIndexOptions } from "../anime/file-index.js";
import * as fileIndexService from "../anime/file-index.js";
import { log } from "../../../common/tools/logger.js";

async function getDriverForDriveId(driveId: string): Promise<{ driver: FileSystemDriver; rootPath: string }> {
  const driveRecord = await getDrive(driveId);
  if (!driveRecord) throw new Error("存储节点不存在");
  if (driveRecord.connectionConfigId == null) {
    throw new Error("该存储节点尚未关联连接配置");
  }
  const configRecord = await getConnectionConfigById(driveRecord.connectionConfigId);
  if (!configRecord) throw new Error("连接配置不存在");
  const driver = createDriver(configRecord);
  const rootPath = (driver as { getRootPath?: () => string }).getRootPath?.() ?? "";
  return { driver, rootPath };
}

export async function refreshDir(
  driveId: string,
  dirPath: string
): Promise<void> {
  const { driver, rootPath } = await getDriverForDriveId(driveId);
  const startPath = dirPath || rootPath;

  async function recursiveList(currentPath: string): Promise<void> {
    const entries = await driver.list(currentPath);
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
        try {
          await recursiveList(entry.path);
        } catch (err) {
          log.error(err, "递归列出目录失败: %s", entry.path);
        }
      }
    }
  }

  await recursiveList(startPath);
}

export async function getDriveStats(driveId: string) {
  return fileIndexService.getStats(driveId);
}

export async function listDriveIndex(
  driveId: string,
  options: ListIndexOptions
) {
  return fileIndexService.listIndex(driveId, options);
}

