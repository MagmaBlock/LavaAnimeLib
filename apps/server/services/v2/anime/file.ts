import parseFileName from "anime-file-parser";
import { and, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { connectionConfigs } from "../../../common/database/schema/connection-config.js";
import { driveEndpoints } from "../../../common/database/schema/drive-endpoint.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getDefaultDrive, getDrive } from "../drive/index.js";
import { getAnimeByID } from "./index.js";
import * as fileIndexService from "./file-index.js";
import { log } from "../../../common/tools/logger.js";

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

  const animeType = anime.type as { nsfw?: boolean } | undefined;
  if (animeType?.nsfw && thisDrive.banNSFW) {
    return "存储节点不支持当前类型动画";
  }

  if (thisDrive.connectionConfigId == null) {
    return "存储节点尚未配置连接";
  }

  const endpoint = await resolveEndpoint(thisDrive.id, endpointId);
  if (!endpoint) return "没有可用的对外节点";

  const configRow = await db
    .select()
    .from(connectionConfigs)
    .where(eq(connectionConfigs.id, endpoint.connectionConfigId))
    .limit(1);

  if (!configRow.length) return "连接配置不存在";

  const driver = createDriver(configRow[0]);
  const animeIndex = anime.index as { year: string; type: string; name: string };
  const dirPath = joinPaths(animeIndex.year, animeIndex.type, animeIndex.name);

  const isCached = await fileIndexService.isCacheValid(thisDrive.id, dirPath);

  let files: fileIndexService.FileIndexRecord[];

  if (isCached) {
    files = await fileIndexService.findActiveByDrive(thisDrive.id, dirPath);
  } else {
    try {
      await refreshDirectory(driver, thisDrive.id, dirPath);
      files = await fileIndexService.findActiveByDrive(thisDrive.id, dirPath);
    } catch (err) {
      log.error(err, `刷新文件索引失败: ${dirPath}`);
      return "请求存储节点时服务端发生意外错误";
    }
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
        endpoint.url,
      );
      base.url = downloadUrl;
      base.parseResult = parseFileName(entry.name);
    }

    return base;
  });
}

async function resolveEndpoint(
  driveId: string,
  endpointId?: number
): Promise<{ id: number; connectionConfigId: number; url: string } | null> {
  if (endpointId != null) {
    const rows = await db
      .select({ id: driveEndpoints.id, connectionConfigId: driveEndpoints.connectionConfigId, url: driveEndpoints.url })
      .from(driveEndpoints)
      .where(and(eq(driveEndpoints.id, endpointId), eq(driveEndpoints.enabled, 1)))
      .limit(1);
    return rows[0] ?? null;
  }

  const rows = await db
    .select({ id: driveEndpoints.id, connectionConfigId: driveEndpoints.connectionConfigId, url: driveEndpoints.url })
    .from(driveEndpoints)
    .where(and(eq(driveEndpoints.driveId, driveId), eq(driveEndpoints.enabled, 1)))
    .limit(1);
  return rows[0] ?? null;
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
  if (thisDrive.connectionConfigId == null) throw new Error("存储节点尚未配置连接");

  const configRow = await db
    .select()
    .from(connectionConfigs)
    .where(eq(connectionConfigs.id, thisDrive.connectionConfigId))
    .limit(1);

  if (!configRow.length) throw new Error("连接配置不存在");

  const driver = createDriver(configRow[0]);
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
