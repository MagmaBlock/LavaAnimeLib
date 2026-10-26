import pLimit from "p-limit";
import type { LimitFunction } from "p-limit";
import { db } from "../../common/database/connection.js";
import { drives } from "../../common/database/schema/drive.js";
import { eq } from "drizzle-orm";
import { createDriver } from "../../common/filesystem/factory.js";
import type { FileSystemDriver, FileSystemEntry } from "../../common/filesystem/types.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import {
  sanitizeScanError,
  updateDriveScanHealth,
} from "../../services/v2/drive/scan-health.js";
import { log } from "../../common/tools/logger.js";
import type { DriveConfig } from "@lavaanime/shared";
import { parseJsonField } from "../../common/tools/parse-json-field.js";

const DIR_CONCURRENCY = 4;
const WRITE_CONCURRENCY = 2;

export interface ScanDriveResult {
  driveId: string;
  ok: boolean;
  /** 该节点是否参与番剧库识别/覆盖判定 */
  librarySync: boolean;
  rows: number;
  finishedAt: Date;
  error?: string;
}

export interface ScanReport {
  /** 所有启用节点是否全部扫描成功（诊断用，包含非库节点） */
  ok: boolean;
  /** 至少一个库节点且全部库节点扫描成功时为 true */
  libraryOk: boolean;
  drives: ScanDriveResult[];
}

interface ScanStats {
  total: number;
  files: number;
  dirs: number;
  directories: number;
}

interface DirectoryScanResult {
  stats: ScanStats;
  failures: string[];
}

interface ScanContext {
  driveId: string;
  driver: FileSystemDriver;
  listLimit: LimitFunction;
  writeLimit: LimitFunction;
}

export default async function scanAllDrives(): Promise<ScanReport> {
  const driveRows = await db
    .select({
      id: drives.id,
      type: drives.type,
      config: drives.config,
      librarySync: drives.librarySync,
    })
    .from(drives)
    .where(eq(drives.enabled, 1));

  log.info(`共 ${driveRows.length} 个存储节点待扫描`);

  const results = await Promise.all(driveRows.map((row) => scanSingleDrive(row)));
  const ok = results.length > 0 && results.every((result) => result.ok);
  const libraryDrives = results.filter((result) => result.librarySync);
  const libraryOk =
    libraryDrives.length > 0 && libraryDrives.every((result) => result.ok);

  return { ok, libraryOk, drives: results };
}

async function scanSingleDrive(row: {
  id: string;
  type: string;
  config: unknown;
  librarySync: number;
}): Promise<ScanDriveResult> {
  let ok = false;
  let rows = 0;
  let error: string | undefined;
  let config: unknown = null;
  const librarySync = row.librarySync === 1;

  try {
    config = parseJsonField(row.config);
    if (!config) {
      throw new Error(`Drive ${row.id} 的 config 无效或未配置`);
    }
    if (typeof row.type !== "string" || row.type.length === 0) {
      throw new Error(`Drive ${row.id} 的 type 无效或未配置`);
    }

    const driver = createDriver({
      type: row.type,
      config: config as unknown as DriveConfig,
    });
    log.info(`[${row.id}] 开始全量扫描...`);

    const outcome = await scanDirectory(
      {
        driveId: row.id,
        driver,
        listLimit: pLimit(DIR_CONCURRENCY),
        writeLimit: pLimit(WRITE_CONCURRENCY),
      },
      "/",
    );

    rows = outcome.stats.total;

    if (outcome.failures.length === 0) {
      ok = true;
      log.info(
        `[${row.id}] 扫描完成: ${outcome.stats.total} 条 (${outcome.stats.files} 文件, ${outcome.stats.dirs} 目录, ${outcome.stats.directories} 个文件夹)`,
      );
    } else {
      error = sanitizeScanError(outcome.failures.join("; "), config);
      log.error(
        `[${row.id}] 扫描未完成: ${outcome.failures.length} 个目录/写入失败, 已观察 ${rows} 条`,
      );
    }
  } catch (err) {
    error = sanitizeScanError(err, config);
    log.error(err, `扫描 Drive ${row.id} 失败`);
  }

  const finishedAt = new Date();

  try {
    await updateDriveScanHealth(row.id, {
      ok,
      rows,
      error,
      scannedAt: finishedAt,
    });
  } catch (healthError) {
    log.error(healthError, `记录 Drive ${row.id} 扫描健康状态失败`);
  }

  return error
    ? { driveId: row.id, ok, librarySync, rows, finishedAt, error }
    : { driveId: row.id, ok, librarySync, rows, finishedAt };
}

async function scanDirectory(
  context: ScanContext,
  currentPath: string,
): Promise<DirectoryScanResult> {
  let entries: FileSystemEntry[];
  try {
    entries = await context.listLimit(() => context.driver.list(currentPath));
  } catch (err) {
    const error = sanitizeScanError(err);
    log.error(err, `列出目录失败: ${currentPath}`);
    return {
      stats: { total: 0, files: 0, dirs: 0, directories: 0 },
      failures: [`${currentPath}: ${error}`],
    };
  }

  const fileEntries = entries.filter((entry) => entry.type === "file");
  const dirEntries = entries.filter((entry) => entry.type === "dir");
  log.info(
    `[${context.driveId}] ${currentPath} → ${fileEntries.length} 文件, ${dirEntries.length} 目录`,
  );

  const currentPaths = entries.map((entry) => entry.path);
  const upsertEntries = entries.map((entry) => ({
    driveId: context.driveId,
    path: entry.path,
    name: entry.name,
    size: entry.size,
    type: entry.type,
    modified: entry.modified ? new Date(entry.modified) : null,
  }));

  const stats: ScanStats = {
    total: entries.length,
    files: fileEntries.length,
    dirs: dirEntries.length,
    directories: 1,
  };
  const failures: string[] = [];

  try {
    await context.writeLimit(async () => {
      await fileIndexService.upsertEntries(upsertEntries);
      await fileIndexService.softDeleteStale(
        context.driveId,
        currentPath,
        currentPaths,
      );
    });
  } catch (err) {
    const error = sanitizeScanError(err);
    log.error(err, `写入目录索引失败: ${currentPath}`);
    // 写入失败时不再向下递归，避免继续放大不完整的索引状态
    return { stats, failures: [`${currentPath}: ${error}`] };
  }

  if (dirEntries.length > 0) {
    const subResults = await Promise.all(
      dirEntries.map((entry) => scanDirectory(context, entry.path)),
    );
    for (const sub of subResults) {
      stats.total += sub.stats.total;
      stats.files += sub.stats.files;
      stats.dirs += sub.stats.dirs;
      stats.directories += sub.stats.directories;
      failures.push(...sub.failures);
    }
  }

  return { stats, failures };
}
