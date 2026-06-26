import pLimit from "p-limit";
import type { FileSystemDriver } from "../../../common/filesystem/types.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getDrive } from "../drive/index.js";
import type { ListIndexOptions } from "../anime/file-index.js";
import * as fileIndexService from "../anime/file-index.js";
import { log } from "../../../common/tools/logger.js";

const DIR_CONCURRENCY = 4;
const STALE_MS = 10 * 60 * 1000;
const LOG_MAX = 20;

export interface RefreshLogEntry {
  time: number;
  path: string;
  files: number;
  dirs: number;
}

export interface RefreshJob {
  driveId: string;
  startPath: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  finishedAt: number | null;
  dirsScanned: number;
  filesFound: number;
  dirsFound: number;
  errors: number;
  currentPath: string;
  lastError: string | null;
  log: RefreshLogEntry[];
}

interface InternalRefreshJob extends RefreshJob {
  runId: number;
  lastActivityAt: number;
}

const refreshJobs = new Map<string, InternalRefreshJob>();
let refreshRunCounter = 0;

export function getRefreshStatus(driveId: string): RefreshJob | null {
  const job = refreshJobs.get(driveId);
  if (!job) return null;
  return {
    driveId: job.driveId,
    startPath: job.startPath,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    dirsScanned: job.dirsScanned,
    filesFound: job.filesFound,
    dirsFound: job.dirsFound,
    errors: job.errors,
    currentPath: job.currentPath,
    lastError: job.lastError,
    log: [...job.log],
  };
}

async function getDriverForDriveId(driveId: string): Promise<{ driver: FileSystemDriver }> {
  const driveRecord = await getDrive(driveId);
  if (!driveRecord) throw new Error("存储节点不存在");
  const driver = createDriver({ type: driveRecord.type, config: driveRecord.config });
  return { driver };
}

/**
 * 同步入口：检查是否已有运行中任务，创建并登记新 job。
 * - 已有 running 且 10min 内有活动 → 返回 { busy: true }
 * - 已有 running 但超过 10min 无活动（卡死）→ 覆写
 * - 无任务 / 已完成 / 已失败 → 覆写
 * 返回 { job } 后用 executeRefresh(job) 异步执行。
 */
export function prepareRefreshJob(
  driveId: string,
  dirPath: string
): { job: InternalRefreshJob } | { busy: true } {
  const existing = refreshJobs.get(driveId);
  if (
    existing &&
    existing.status === "running" &&
    Date.now() - existing.lastActivityAt < STALE_MS
  ) {
    return { busy: true };
  }

  const now = Date.now();
  const job: InternalRefreshJob = {
    driveId,
    startPath: dirPath || "/",
    status: "running",
    startedAt: now,
    finishedAt: null,
    dirsScanned: 0,
    filesFound: 0,
    dirsFound: 0,
    errors: 0,
    currentPath: dirPath || "/",
    lastError: null,
    runId: ++refreshRunCounter,
    lastActivityAt: now,
    log: [],
  };
  refreshJobs.set(driveId, job);
  return { job };
}

/**
 * 异步执行刷新。worker 在每次递归前检查 runId 是否仍为当前 job，
 * 若被新请求覆写则自我中止，避免并发扫描同一节点。
 */
export async function executeRefresh(job: InternalRefreshJob): Promise<void> {
  const { driveId, runId } = job;

  function isCurrent(): boolean {
    return refreshJobs.get(driveId)?.runId === runId;
  }

  try {
    const { driver } = await getDriverForDriveId(driveId);
    if (!isCurrent()) return;
    log.info(`[${driveId}] 开始刷新目录索引: ${job.startPath}`);

    const limit = pLimit(DIR_CONCURRENCY);

    async function recursiveList(currentPath: string, depth: number): Promise<void> {
      if (!isCurrent()) return;
      job.currentPath = currentPath;
      job.lastActivityAt = Date.now();

      const entries = await limit(() => driver.list(currentPath));
      if (!isCurrent()) return;

      const fileCount = entries.filter((e) => e.type === "file").length;
      const dirCount = entries.filter((e) => e.type === "dir").length;
      job.dirsScanned++;
      job.filesFound += fileCount;
      job.dirsFound += dirCount;
      job.lastActivityAt = Date.now();
      log.info(`[${driveId}] ${"  ".repeat(depth)}${currentPath} → ${fileCount} 文件, ${dirCount} 目录`);

      job.log.push({ time: job.lastActivityAt, path: currentPath, files: fileCount, dirs: dirCount });
      if (job.log.length > LOG_MAX) job.log.splice(0, job.log.length - LOG_MAX);

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
      if (!isCurrent()) return;

      const subDirs = entries.filter((e) => e.type === "dir");
      if (subDirs.length > 0) {
        await Promise.all(
          subDirs.map((entry) =>
            recursiveList(entry.path, depth + 1).catch((err) => {
              if (!isCurrent()) return;
              job.errors++;
              job.lastError = err instanceof Error ? err.message : String(err);
              job.lastActivityAt = Date.now();
              log.error(err, "递归列出目录失败: %s", entry.path);
            })
          )
        );
      }
    }

    await recursiveList(job.startPath, 0);

    if (isCurrent()) {
      job.status = "completed";
      job.finishedAt = Date.now();
      log.info(`[${driveId}] 目录刷新完成: ${job.startPath}`);
    }
  } catch (err) {
    if (isCurrent()) {
      job.status = "failed";
      job.finishedAt = Date.now();
      job.lastError = err instanceof Error ? err.message : String(err);
    }
    throw err;
  }
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
