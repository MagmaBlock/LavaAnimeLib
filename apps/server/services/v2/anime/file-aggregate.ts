import parseFileName from "anime-file-parser";
import { asc, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { drives } from "../../../common/database/schema/drive.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getAnimeByID } from "./index.js";
import * as fileIndexService from "./file-index.js";
import { log } from "../../../common/tools/logger.js";
import { mapDriveRecord } from "../admin/drive.js";
import type { AggregatedFileItem, FileDriveSource } from "@lavaanime/shared";

interface AggregatedFileResult extends AggregatedFileItem {
  parseResult?: ReturnType<typeof parseFileName>;
}

export async function getAggregatedFiles(laID: number): Promise<AggregatedFileResult[]> {
  const anime = await getAnimeByID(laID);
  if (anime.deleted) throw new Error("此 laID 不存在");

  const animeIndex = anime.index as { year: string; type: string; name: string };
  const dirPath = joinPaths(animeIndex.year, animeIndex.type, animeIndex.name);

  const allDriveRows = await db
    .select()
    .from(drives)
    .where(eq(drives.enabled, 1))
    .orderBy(asc(drives.sortOrder), asc(drives.id));

  const driveRecords = allDriveRows.map(mapDriveRecord);

  const results = await Promise.allSettled(
    driveRecords.map(async (drive) => {
      const isCached = await fileIndexService.isCacheValid(drive.id, dirPath);

      if (!isCached) {
        try {
          const driver = createDriver({ type: drive.type, config: drive.config });
          const entries = await driver.list(dirPath);
          const upsertEntries = entries.map((entry) => ({
            driveId: drive.id,
            path: entry.path,
            name: entry.name,
            size: entry.size,
            type: entry.type,
            modified: entry.modified ? new Date(entry.modified) : null,
          }));
          const currentPaths = entries.map((e) => e.path);
          await fileIndexService.upsertEntries(upsertEntries);
          await fileIndexService.softDeleteStale(drive.id, dirPath, currentPaths);
        } catch (err) {
          log.warn(err, `聚合文件列表: 刷新驱动 ${drive.id} 索引失败`);
        }
      }

      const files = await fileIndexService.findActiveByDrive(drive.id, dirPath);
      return files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        modified: f.modified?.toISOString() ?? null,
        path: f.path,
        driveId: drive.id,
        driveName: drive.name,
      }));
    })
  );

  const dedupMap = new Map<string, AggregatedFileResult>();

  for (const result of results) {
    if (result.status === "rejected") {
      log.warn(result.reason, "聚合文件列表: 某个驱动查询失败");
      continue;
    }
    for (const file of result.value) {
      const relPath = extractRelativePath(file.path, dirPath);
      const existing = dedupMap.get(relPath);

      if (existing) {
        existing.drives.push({ driveId: file.driveId, driveName: file.driveName, path: file.path });
        if (file.size > existing.size) {
          existing.size = file.size;
        }
      } else {
        const item: AggregatedFileResult = {
          name: file.name,
          size: file.size,
          type: file.type,
          modified: file.modified,
          drives: [{ driveId: file.driveId, driveName: file.driveName, path: file.path }],
        };
        if (file.type === "file") {
          item.parseResult = parseFileName(file.name);
        }
        dedupMap.set(relPath, item);
      }
    }
  }

  return Array.from(dedupMap.values());
}

function joinPaths(...segments: string[]): string {
  const cleaned = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter((s) => s.length > 0);
  return "/" + cleaned.join("/");
}

function extractRelativePath(fullPath: string, dirPath: string): string {
  const normalized = dirPath.replace(/\/+$/, "");
  if (fullPath.startsWith(normalized + "/")) {
    return fullPath.slice(normalized.length + 1);
  }
  return fullPath;
}
