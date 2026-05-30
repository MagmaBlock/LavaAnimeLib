import parseFileName from "anime-file-parser";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { driveEndpoints } from "../../../common/database/schema/drive-endpoint.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getDefaultDrive, getDrive } from "../drive/index.js";
import { getAnimeByID } from "./index.js";
import * as fileIndexService from "./file-index.js";
import { log } from "../../../common/tools/logger.js";
import type { DriveConfigOverride } from "@lavaanime/shared";
import { parseJsonField } from "../../../common/tools/parse-json-field.js";

interface FileItem {
  name: string;
  size: number;
  updated: string;
  driver: string;
  thumbnail: string;
  type: "dir" | "file";
  parseResult?: ReturnType<typeof parseFileName>;
  url?: string;
}

export async function getFilesByID(
  laID: number,
  drive?: string,
  endpointId?: number
): Promise<FileItem[] | string> {
  const anime = await getAnimeByID(laID);
  if (anime.deleted) return "此 laID 不存在";

  const thisDrive = await getDrive(drive ?? await getDefaultDrive());
  if (!thisDrive) return "存储节点不存在";

  const endpoint = await resolveEndpoint(thisDrive.id, endpointId);
  if (!endpoint) return "没有可用的对外节点";

  if (thisDrive.banNSFW && (anime.type as { nsfw?: boolean })?.nsfw) {
    return "存储节点不支持当前类型动画";
  }

  const effectiveConfig = endpoint.configOverride
    ? { ...thisDrive.config, ...endpoint.configOverride }
    : thisDrive.config;

  let driver: ReturnType<typeof createDriver>;
  try {
    driver = createDriver({ type: thisDrive.type, config: effectiveConfig });
  } catch (err) {
    log.error(err, `创建文件系统驱动失败: endpoint=${endpointId} drive=${thisDrive.id}`);
    return "创建文件系统驱动失败";
  }

  const animeIndex = anime.index as { year: string; type: string; name: string };
  const dirPath = joinPaths(animeIndex.year, animeIndex.type, animeIndex.name);

  try {
    const scanDriver = createDriver({ type: thisDrive.type, config: thisDrive.config });
    const isCached = await fileIndexService.isCacheValid(thisDrive.id, dirPath);

    let files: fileIndexService.FileIndexRecord[];

    if (isCached) {
      files = await fileIndexService.findActiveByDrive(thisDrive.id, dirPath);
    } else {
      await refreshDirectory(scanDriver, thisDrive.id, dirPath);
      files = await fileIndexService.findActiveByDrive(thisDrive.id, dirPath);
    }

    return files.map((entry) => {
      const base: FileItem = {
        name: entry.name,
        size: entry.size,
        updated: entry.modified?.toISOString() ?? "",
        driver: thisDrive.id,
        thumbnail: "",
        type: entry.type as "dir" | "file",
      };

      if (entry.type === "file") {
        const downloadUrl = driver.getDownloadUrl(
          {
            name: entry.name,
            path: entry.path,
            type: "file",
            size: entry.size,
            modified: entry.modified?.toISOString() ?? "",
            sign: entry.sign ?? undefined,
          },
          effectiveConfig.host,
        );
        base.url = downloadUrl;
        base.parseResult = parseFileName(entry.name);
      }

      return base;
    });
  } catch (err) {
    log.error(err, `获取文件列表失败: drive=${thisDrive.id} dir=${dirPath} endpoint=${endpointId}`);
    return "请求存储节点时服务端发生意外错误";
  }
}

async function resolveEndpoint(
  driveId: string,
  endpointId?: number
): Promise<{ id: number; configOverride: DriveConfigOverride | null; banNSFW: boolean; disableDownload: boolean } | null> {
  if (endpointId != null) {
    const rows = await db
      .select({
        id: driveEndpoints.id,
        configOverride: driveEndpoints.configOverride,
        banNSFW: driveEndpoints.banNSFW,
        disableDownload: driveEndpoints.disableDownload,
      })
      .from(driveEndpoints)
      .where(and(
        eq(driveEndpoints.id, endpointId),
        eq(driveEndpoints.driveId, driveId),
        eq(driveEndpoints.enabled, 1),
      ))
      .limit(1);
    if (!rows[0]) return null;
    const override = parseJsonField(rows[0].configOverride);
    return {
      ...rows[0],
      configOverride: (override && Object.keys(override).length > 0 ? override : null) as DriveConfigOverride | null,
      banNSFW: toBoolean(rows[0].banNSFW),
      disableDownload: toBoolean(rows[0].disableDownload),
    };
  }

  const rows = await db
    .select({
      id: driveEndpoints.id,
      configOverride: driveEndpoints.configOverride,
      banNSFW: driveEndpoints.banNSFW,
      disableDownload: driveEndpoints.disableDownload,
    })
    .from(driveEndpoints)
    .where(and(eq(driveEndpoints.driveId, driveId), eq(driveEndpoints.enabled, 1)))
    .orderBy(asc(driveEndpoints.priority), asc(driveEndpoints.id));

  const override2 = rows[0] ? parseJsonField(rows[0].configOverride) : null;
  return rows[0]
    ? {
        ...rows[0],
        configOverride: (override2 && Object.keys(override2).length > 0 ? override2 : null) as DriveConfigOverride | null,
        banNSFW: toBoolean(rows[0].banNSFW),
        disableDownload: toBoolean(rows[0].disableDownload),
      }
    : null;
}

async function refreshDirectory(
  driver: ReturnType<typeof createDriver>,
  driveId: string,
  dirPath: string
): Promise<void> {
  try {
    const entries = await driver.list(dirPath);
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
    await fileIndexService.softDeleteStale(driveId, dirPath, currentPaths);
  } catch (err) {
    log.error(err, `刷新目录索引失败: ${dirPath}`);
    throw err;
  }
}

export async function refreshAnimeFileIndex(laID: number, driveId?: string): Promise<void> {
  const anime = await getAnimeByID(laID);
  if (anime.deleted) throw new Error("此 laID 不存在");

  const thisDrive = await getDrive(driveId ?? await getDefaultDrive());
  if (!thisDrive) throw new Error("存储节点不存在");

  const driver = createDriver({ type: thisDrive.type, config: thisDrive.config });
  const animeIndex = anime.index as { year: string; type: string; name: string };
  const dirPath = joinPaths(animeIndex.year, animeIndex.type, animeIndex.name);

  await refreshDirectory(driver, thisDrive.id, dirPath);
}

function joinPaths(...segments: string[]): string {
  const cleaned = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter((s) => s.length > 0);
  return "/" + cleaned.join("/");
}

function toBoolean(value: number): boolean {
  return value === 1;
}
