import { and, asc, count, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";
import { subjectEpisodes } from "../../../common/database/schema/bangumi-episodes.js";
import { subjectCharacters } from "../../../common/database/schema/bangumi-subject-characters.js";
import { anime } from "../../../common/database/schema/anime.js";
import { log } from "../../../common/tools/logger.js";
import { getSiteSetting, setSiteSetting } from "../site/setting.js";
import {
  getBangumiSubjects,
  getBangumiRelations,
  getBangumiCharacters,
} from "./api.js";
import { syncAll } from "./sync.js";

export const BANGUMI_CACHE_SETTINGS_KEY = "bangumi_cache";
const DEFAULT_EXPIRE_HOURS = 24 * 7;
const AUTO_UPDATE_INTERVAL_MS = 1000 * 60 * 60 * 6;
const MAX_AUTO_UPDATE_ITEMS = 30;

export interface BangumiCacheSettings {
  autoUpdateEnabled: boolean;
  expireHours: number;
}

export interface BangumiCacheItem {
  bgmID: number;
  updateTime: Date | null;
  syncStatus: "synced" | "expired" | "unsynced";
  hasEpisodes: boolean;
  hasCharacters: boolean;
  animeCount: number;
}

export interface BangumiCacheListResult {
  list: BangumiCacheItem[];
  total: number;
  settings: BangumiCacheSettings;
}

export interface BangumiCacheLogEntry {
  bgmID: number;
  status: "success" | "failed";
  time: number;
  error?: string;
}

export interface BangumiCacheBatch {
  startedAt: number;
  finishedAt: number | null;
  total: number;
  completed: number;
  failed: number;
}

interface ActiveBatch extends BangumiCacheBatch {
  members: Set<number>;
}

export interface BangumiCacheStatus {
  active: number;
  pending: number;
  concurrency: number;
  refreshing: number[];
  schedulerRunning: boolean;
  totalCompleted: number;
  totalFailed: number;
  lastEventAt: number | null;
  currentBatch: BangumiCacheBatch | null;
  lastBatch: BangumiCacheBatch | null;
  log: BangumiCacheLogEntry[];
}

const refreshingBgmIDs = new Set<number>();
const pendingBgmIDs = new Set<number>();
const MAX_CONCURRENT = 5;
let activeCount = 0;
let schedulerStarted = false;

let totalCompleted = 0;
let totalFailed = 0;
let lastEventAt: number | null = null;
let currentBatch: ActiveBatch | null = null;
let lastBatch: BangumiCacheBatch | null = null;
const LOG_MAX = 30;
const logEntries: BangumiCacheLogEntry[] = [];

function recordRefreshResult(bgmID: number, ok: boolean, error?: string): void {
  if (ok) totalCompleted++;
  else totalFailed++;
  lastEventAt = Date.now();
  logEntries.unshift({ bgmID, status: ok ? "success" : "failed", time: lastEventAt, error });
  if (logEntries.length > LOG_MAX) logEntries.length = LOG_MAX;
  if (currentBatch && currentBatch.members.has(bgmID)) {
    if (ok) currentBatch.completed++;
    else currentBatch.failed++;
    currentBatch.members.delete(bgmID);
  }
}

function maybeCloseBatch(): void {
  if (
    currentBatch &&
    activeCount === 0 &&
    pendingBgmIDs.size === 0 &&
    currentBatch.members.size === 0
  ) {
    currentBatch.finishedAt = Date.now();
    lastBatch = currentBatch;
    currentBatch = null;
  }
}

export function getBangumiCacheStatus(): BangumiCacheStatus {
  return {
    active: activeCount,
    pending: pendingBgmIDs.size,
    concurrency: MAX_CONCURRENT,
    refreshing: [...refreshingBgmIDs],
    schedulerRunning: schedulerStarted,
    totalCompleted,
    totalFailed,
    lastEventAt,
    currentBatch: currentBatch
      ? {
          startedAt: currentBatch.startedAt,
          finishedAt: currentBatch.finishedAt,
          total: currentBatch.total,
          completed: currentBatch.completed,
          failed: currentBatch.failed,
        }
      : null,
    lastBatch: lastBatch ? { ...lastBatch } : null,
    log: [...logEntries],
  };
}

// --- Settings ---

export async function getBangumiCacheSettings(): Promise<BangumiCacheSettings> {
  const raw = await getSiteSetting(BANGUMI_CACHE_SETTINGS_KEY);
  const setting = raw && typeof raw === "object" ? raw as Partial<BangumiCacheSettings> : {};
  return normalizeSettings(setting);
}

export async function updateBangumiCacheSettings(
  input: Partial<BangumiCacheSettings>
): Promise<BangumiCacheSettings> {
  const current = await getBangumiCacheSettings();
  const next = normalizeSettings({ ...current, ...input });
  await setSiteSetting(BANGUMI_CACHE_SETTINGS_KEY, next);
  return next;
}

// --- List ---

export async function listBangumiCaches(
  skip = 0,
  take = 50
): Promise<BangumiCacheListResult> {
  const settings = await getBangumiCacheSettings();
  const expireBefore = getExpireBefore(settings.expireHours);

  // Get all distinct bgmIDs from anime table with bgmid
  const allBgmRows = await db
    .select({ bgmid: anime.bgmid })
    .from(anime)
    .where(and(eq(anime.deleted, 0), sql`${anime.bgmid} IS NOT NULL`, sql`${anime.bgmid} != ''`));

  const allBgmIDs = [...new Set(
    allBgmRows.map(r => Number.parseInt(r.bgmid ?? "", 10)).filter(n => Number.isFinite(n) && n > 0)
  )].sort((a, b) => a - b);

  const total = allBgmIDs.length;
  const pageIDs = allBgmIDs.slice(skip, skip + take);

  // Get subjects data for these IDs
  const subRows = pageIDs.length > 0 ? await db
    .select({
      bgmid: subjects.bgmid,
      updatedAt: subjects.fetched_at,
      subjectId: subjects.id,
    })
    .from(subjects)
    .where(inArray(subjects.bgmid, pageIDs)) : [];

  const subMap = new Map(subRows.map(r => [r.bgmid, r]));
  const subjectIds = subRows.map(r => r.subjectId).filter(Boolean);

  // Check for episodes and characters
  const epRows = subjectIds.length > 0 ? await db
    .select({ subject_id: subjectEpisodes.subject_id })
    .from(subjectEpisodes)
    .where(inArray(subjectEpisodes.subject_id, subjectIds)) : [];

  const charRows = subjectIds.length > 0 ? await db
    .select({ subject_id: subjectCharacters.subject_id })
    .from(subjectCharacters)
    .where(inArray(subjectCharacters.subject_id, subjectIds)) : [];

  const epSubjectIds = new Set(epRows.map(r => r.subject_id));
  const charSubjectIds = new Set(charRows.map(r => r.subject_id));

  // Count anime rows per bgmID
  const countRows = pageIDs.length > 0 ? await db
    .select({ bgmid: anime.bgmid, cnt: count(anime.id) })
    .from(anime)
    .where(and(eq(anime.deleted, 0), inArray(anime.bgmid, pageIDs.map(String))))
    .groupBy(anime.bgmid) : [];

  const countMap = new Map(countRows.map(r => [parseInt(r.bgmid ?? "0", 10), Number(r.cnt)]));

  const list: BangumiCacheItem[] = pageIDs.map(bgmID => {
    const sub = subMap.get(bgmID);
    if (!sub) {
      return {
        bgmID,
        updateTime: null,
        syncStatus: "unsynced",
        hasEpisodes: false,
        hasCharacters: false,
        animeCount: countMap.get(bgmID) ?? 0,
      };
    }

    const expired = isExpired(sub.updatedAt, expireBefore);
    return {
      bgmID,
      updateTime: sub.updatedAt,
      syncStatus: expired ? "expired" : "synced",
      hasEpisodes: epSubjectIds.has(sub.subjectId),
      hasCharacters: charSubjectIds.has(sub.subjectId),
      animeCount: countMap.get(bgmID) ?? 0,
    };
  });

  return { list, total, settings };
}

// --- Ensure / Refresh ---

export async function ensureStructuredData(bgmID: number): Promise<void> {
  if (!Number.isFinite(bgmID) || bgmID <= 0) return;

  const settings = await getBangumiCacheSettings();
  const expireBefore = getExpireBefore(settings.expireHours);

  const [row] = await db
    .select({ bgmid: subjects.bgmid, updatedAt: subjects.fetched_at })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);

  if (row && !isExpired(row.updatedAt, expireBefore)) return;

  queueBangumiCacheRefresh(bgmID);
}

export async function ensureAllAnimeBangumiCaches(): Promise<number> {
  const allBgmIDs = await getAllBgmIDInAnimeTable();
  if (allBgmIDs.length === 0) return 0;

  const existingRows = await db
    .select({ bgmid: subjects.bgmid })
    .from(subjects)
    .where(inArray(subjects.bgmid, allBgmIDs));

  const existingBgmIDs = new Set(existingRows.map(r => r.bgmid));
  const missingBgmIDs = allBgmIDs.filter(id => !existingBgmIDs.has(id));

  for (const bgmID of missingBgmIDs) {
    queueBangumiCacheRefresh(bgmID);
  }

  if (missingBgmIDs.length > 0) {
    log.info("Queued %d unsynced Bangumi entries for refresh", missingBgmIDs.length);
  }

  return missingBgmIDs.length;
}

function processQueue(): void {
  while (activeCount < MAX_CONCURRENT && pendingBgmIDs.size > 0) {
    const bgmID = pendingBgmIDs.values().next().value as number;
    // 已在刷新中的直接丢弃等待中的副本，避免重复入队导致任务丢失
    if (refreshingBgmIDs.has(bgmID)) {
      pendingBgmIDs.delete(bgmID);
      continue;
    }
    pendingBgmIDs.delete(bgmID);
    refreshingBgmIDs.add(bgmID);
    activeCount++;
    refreshBangumiCache(bgmID)
      .then(() => recordRefreshResult(bgmID, true))
      .catch((error) => {
        recordRefreshResult(bgmID, false, error?.message ?? String(error));
        log.error(error, "Bangumi cache refresh failed: bgm%d", bgmID);
      })
      .finally(() => {
        refreshingBgmIDs.delete(bgmID);
        activeCount--;
        maybeCloseBatch();
        processQueue();
      });
  }
}

export function queueBangumiCacheRefresh(bgmID: number): boolean {
  if (!Number.isFinite(bgmID) || bgmID <= 0) return false;
  if (refreshingBgmIDs.has(bgmID) || pendingBgmIDs.has(bgmID)) return false;
  pendingBgmIDs.add(bgmID);
  if (currentBatch) {
    currentBatch.members.add(bgmID);
    currentBatch.total++;
  }
  processQueue();
  return true;
}

export async function refreshBangumiCache(bgmID: number): Promise<boolean> {
  if (!Number.isFinite(bgmID) || bgmID <= 0) throw new Error("Invalid Bangumi ID");

  const bgmSubject = await getBangumiSubjects(bgmID);
  const relations = await getBangumiRelations(bgmID);
  const characters = await getBangumiCharacters(bgmID);

  await syncAll(bgmID, bgmSubject, relations, characters);

  log.info("Bangumi cache refreshed: bgm%d", bgmID);

  return true;
}

export async function refreshExpiredBangumiCaches(
  limit = MAX_AUTO_UPDATE_ITEMS
): Promise<number> {
  const settings = await getBangumiCacheSettings();
  if (!settings.autoUpdateEnabled) return 0;

  const expireBefore = getExpireBefore(settings.expireHours);

  // Find expired rows from subjects
  const expiredRows = await db
    .select({ bgmid: subjects.bgmid })
    .from(subjects)
    .where(lt(subjects.fetched_at, expireBefore))
    .orderBy(asc(subjects.fetched_at))
    .limit(limit);

  // 预先收集待入队 ID（含 unsynced），统一开批次
  const candidateIDs: number[] = expiredRows.map((r) => r.bgmid);

  if (candidateIDs.length < limit) {
    const allBgmIDs = await getAllBgmIDInAnimeTable();
    const existingRows = await db
      .select({ bgmid: subjects.bgmid })
      .from(subjects)
      .where(inArray(subjects.bgmid, allBgmIDs));

    const existingSet = new Set(existingRows.map(r => r.bgmid));
    const unsynced = allBgmIDs.filter(id => !existingSet.has(id));
    const remaining = limit - candidateIDs.length;
    candidateIDs.push(...unsynced.slice(0, remaining));
  }

  if (candidateIDs.length === 0) return 0;

  // 若无活跃批次则开启新批次；已有批次则继续累加
  if (!currentBatch) {
    currentBatch = {
      startedAt: Date.now(),
      finishedAt: null,
      total: 0,
      completed: 0,
      failed: 0,
      members: new Set<number>(),
    };
  }

  let queued = 0;
  for (const bgmID of candidateIDs) {
    if (queueBangumiCacheRefresh(bgmID)) queued++;
  }

  return queued;
}

// --- Scheduler ---

export function startBangumiCacheScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const run = async () => {
    try {
      const count = await refreshExpiredBangumiCaches();
      if (count > 0) log.info("Queued %d Bangumi cache refresh tasks", count);
    } catch (error) {
      log.error(error, "Bangumi cache scheduler failed");
    }
  };

  setTimeout(run, 1000 * 30);
  setInterval(run, AUTO_UPDATE_INTERVAL_MS);
}

// --- Internal helpers ---

function normalizeSettings(input: Partial<BangumiCacheSettings>): BangumiCacheSettings {
  const expireHours = Number(input.expireHours);
  return {
    autoUpdateEnabled: input.autoUpdateEnabled !== false,
    expireHours: Number.isFinite(expireHours) && expireHours > 0
      ? Math.floor(expireHours)
      : DEFAULT_EXPIRE_HOURS,
  };
}

function getExpireBefore(expireHours: number): Date {
  return new Date(Date.now() - expireHours * 60 * 60 * 1000);
}

function isExpired(updatedAt: Date | null, expireBefore: Date): boolean {
  if (!updatedAt) return true;
  return updatedAt.getTime() < expireBefore.getTime();
}

async function getAllBgmIDInAnimeTable(): Promise<number[]> {
  const rows = await db
    .select({ bgmid: anime.bgmid })
    .from(anime)
    .where(eq(anime.deleted, 0));

  const ids = rows
    .map((row) => Number.parseInt(row.bgmid ?? "", 10))
    .filter((id) => Number.isFinite(id) && id > 0);

  return [...new Set(ids)];
}
