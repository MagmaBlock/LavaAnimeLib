import pLimit from "p-limit";
import type { FileSystemDriver } from "../../../common/filesystem/types.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getDrive } from "../drive/index.js";
import type { ListIndexOptions } from "../anime/file-index.js";
import * as fileIndexService from "../anime/file-index.js";
import { log } from "../../../common/tools/logger.js";

const DIR_CONCURRENCY = 4;

async function getDriverForDriveId(driveId: string): Promise<{ driver: FileSystemDriver }> {
  const driveRecord = await getDrive(driveId);
  if (!driveRecord) throw new Error("存储节点不存在");
  const driver = createDriver({ type: driveRecord.type, config: driveRecord.config });
  return { driver };
}

export async function refreshDir(
  driveId: string,
  dirPath: string
): Promise<void> {
  const { driver } = await getDriverForDriveId(driveId);
  const startPath = dirPath || "/";
  log.info(`[${driveId}] 开始刷新目录索引: ${startPath}`);

  const limit = pLimit(DIR_CONCURRENCY);

  async function recursiveList(currentPath: string, depth: number): Promise<void> {
    const entries = await limit(() => driver.list(currentPath));
    const fileCount = entries.filter((e) => e.type === "file").length;
    const dirCount = entries.filter((e) => e.type === "dir").length;
    log.info(`[${driveId}] ${"  ".repeat(depth)}${currentPath} → ${fileCount} 文件, ${dirCount} 目录`);

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
      };
    });

    await fileIndexService.upsertEntries(upsertEntries);
    await fileIndexService.softDeleteStale(driveId, currentPath, currentPaths);

    const subDirs = entries.filter((e) => e.type === "dir");
    if (subDirs.length > 0) {
      await Promise.all(
        subDirs.map((entry) =>
          recursiveList(entry.path, depth + 1).catch((err) => {
            log.error(err, "递归列出目录失败: %s", entry.path);
          })
        )
      );
    }
  }

  await recursiveList(startPath, 0);
  log.info(`[${driveId}] 目录刷新完成: ${startPath}`);
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
