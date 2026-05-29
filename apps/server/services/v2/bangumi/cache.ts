import { and, asc, count, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import config from "../../../common/env.js";
import { db } from "../../../common/database/connection.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { anime } from "../../../common/database/schema/anime.js";
import { log } from "../../../common/tools/logger.js";
import { getSiteSetting, setSiteSetting } from "../site/setting.js";
import {
  getBangumiCharacters,
  getBangumiRelations,
  getBangumiSubjects,
} from "./api.js";

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
  hasSubjects: boolean;
  hasRelations: boolean;
  hasCharacters: boolean;
  expired: boolean;
  animeCount: number;
}

export interface BangumiCacheListResult {
  list: BangumiCacheItem[];
  total: number;
  settings: BangumiCacheSettings;
}

const refreshingBgmIDs = new Set<number>();
let schedulerStarted = false;

export async function getBangumiCacheSettings(): Promise<BangumiCacheSettings> {
  const raw = await getSiteSetting(BANGUMI_CACHE_SETTINGS_KEY);
  const setting = raw && typeof raw === "object" ? raw as Partial<BangumiCacheSettings> : {};
  return normalizeSettings(setting);
}

export async function updateBangumiCacheSettings(input: Partial<BangumiCacheSettings>): Promise<BangumiCacheSettings> {
  const current = await getBangumiCacheSettings();
  const next = normalizeSettings({ ...current, ...input });
  await setSiteSetting(BANGUMI_CACHE_SETTINGS_KEY, next);
  return next;
}

export async function listBangumiCaches(skip = 0, take = 50): Promise<BangumiCacheListResult> {
  const settings = await getBangumiCacheSettings();
  const expireBefore = getExpireBefore(settings.expireHours);

  const totalRows = await db
    .select({ total: count() })
    .from(bangumiData);

  const rows = await db
    .select({
      bgmID: bangumiData.bgmid,
      updateTime: bangumiData.update_time,
      subjects: bangumiData.subjects,
      relations: bangumiData.relations_anime,
      characters: bangumiData.characters,
      animeCount: count(anime.id),
    })
    .from(bangumiData)
    .leftJoin(anime, and(eq(sql`cast(${anime.bgmid} as unsigned)`, bangumiData.bgmid), eq(anime.deleted, 0)))
    .groupBy(
      bangumiData.bgmid,
      bangumiData.update_time,
      bangumiData.subjects,
      bangumiData.relations_anime,
      bangumiData.characters
    )
    .orderBy(asc(bangumiData.bgmid))
    .limit(take)
    .offset(skip);

  return {
    list: rows.map((row) => ({
      bgmID: row.bgmID,
      updateTime: row.updateTime,
      hasSubjects: Boolean(row.subjects),
      hasRelations: Boolean(row.relations),
      hasCharacters: Boolean(row.characters),
      expired: isCacheExpired(row.updateTime, expireBefore),
      animeCount: Number(row.animeCount),
    })),
    total: totalRows[0]?.total ?? 0,
    settings,
  };
}

export async function ensureBangumiCache(bgmID: number): Promise<void> {
  if (!Number.isFinite(bgmID) || bgmID <= 0) return;

  const rows = await db
    .select({ bgmID: bangumiData.bgmid, subjects: bangumiData.subjects })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (rows.length > 0 && rows[0].subjects) return;

  if (rows.length === 0) {
    await db
      .insert(bangumiData)
      .values({
        bgmid: bgmID,
        update_time: new Date(100000000),
      })
      .onDuplicateKeyUpdate({
        set: { update_time: sql`${bangumiData.update_time}` },
      });
  }

  queueBangumiCacheRefresh(bgmID);
}

export async function ensureAllAnimeBangumiCaches(): Promise<number> {
  const animeBgmIDs = await getAllBgmIDInAnimeTable();
  if (animeBgmIDs.length === 0) return 0;

  const existingRows = await db
    .select({ bgmID: bangumiData.bgmid })
    .from(bangumiData)
    .where(inArray(bangumiData.bgmid, animeBgmIDs));

  const existingBgmIDs = new Set(existingRows.map((row) => row.bgmID));
  const missingBgmIDs = animeBgmIDs.filter((bgmID) => !existingBgmIDs.has(bgmID));

  for (const bgmID of missingBgmIDs) {
    await db
      .insert(bangumiData)
      .values({
        bgmid: bgmID,
        update_time: new Date(100000000),
      })
      .onDuplicateKeyUpdate({
        set: { update_time: sql`${bangumiData.update_time}` },
      });
  }

  if (missingBgmIDs.length > 0) {
    log.info("Inserted %d missing Bangumi cache rows", missingBgmIDs.length);
  }

  return missingBgmIDs.length;
}

export function queueBangumiCacheRefresh(bgmID: number): void {
  if (!Number.isFinite(bgmID) || bgmID <= 0 || refreshingBgmIDs.has(bgmID)) return;
  refreshingBgmIDs.add(bgmID);
  refreshBangumiCache(bgmID)
    .catch((error) => log.error(error, "Bangumi cache refresh failed: bgm%d", bgmID))
    .finally(() => refreshingBgmIDs.delete(bgmID));
}

export async function refreshBangumiCache(bgmID: number): Promise<boolean> {
  if (!Number.isFinite(bgmID) || bgmID <= 0) throw new Error("Invalid Bangumi ID");

  const bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable();
  const subject = await getBangumiSubjects(bgmID);
  const relations = await getBangumiRelations(bgmID, bgmIDListInAnimeTable);
  const characters = await getBangumiCharacters(bgmID);

  await db
    .insert(bangumiData)
    .values({
      bgmid: bgmID,
      subjects: JSON.stringify(subject),
      relations_anime: JSON.stringify(relations),
      characters: JSON.stringify(characters),
      update_time: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        subjects: JSON.stringify(subject),
        relations_anime: JSON.stringify(relations),
        characters: JSON.stringify(characters),
        update_time: new Date(),
      },
    });

  await updateAnimePosterByBangumiSubject(bgmID, subject);
  log.info("Bangumi cache refreshed: bgm%d", bgmID);
  return true;
}

export async function refreshExpiredBangumiCaches(limit = MAX_AUTO_UPDATE_ITEMS): Promise<number> {
  const settings = await getBangumiCacheSettings();
  if (!settings.autoUpdateEnabled) return 0;

  const expireBefore = getExpireBefore(settings.expireHours);
  const rows = await db
    .select({ bgmID: bangumiData.bgmid })
    .from(bangumiData)
    .where(and(isNotNull(bangumiData.update_time), lt(bangumiData.update_time, expireBefore)))
    .orderBy(asc(bangumiData.update_time))
    .limit(limit);

  for (const row of rows) {
    queueBangumiCacheRefresh(row.bgmID);
  }

  return rows.length;
}

export function startBangumiCacheScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const run = async () => {
    try {
      const count = await refreshExpiredBangumiCaches();
      if (count > 0) log.info("Queued %d expired Bangumi cache refresh tasks", count);
    } catch (error) {
      log.error(error, "Bangumi cache scheduler failed");
    }
  };

  setTimeout(run, 1000 * 30);
  setInterval(run, AUTO_UPDATE_INTERVAL_MS);
}

function normalizeSettings(input: Partial<BangumiCacheSettings>): BangumiCacheSettings {
  const expireHours = Number(input.expireHours);
  return {
    autoUpdateEnabled: input.autoUpdateEnabled !== false,
    expireHours: Number.isFinite(expireHours) && expireHours > 0 ? Math.floor(expireHours) : DEFAULT_EXPIRE_HOURS,
  };
}

function getExpireBefore(expireHours: number): Date {
  return new Date(Date.now() - expireHours * 60 * 60 * 1000);
}

function isCacheExpired(updateTime: Date | null, expireBefore: Date): boolean {
  if (!updateTime) return true;
  return updateTime.getTime() < expireBefore.getTime();
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

async function updateAnimePosterByBangumiSubject(
  bgmID: number,
  subject: Record<string, unknown>
): Promise<void> {
  const images = subject.images as Record<string, string | undefined> | undefined;
  const poster = images?.large
    ? `${images.large.replace("https://lain.bgm.tv", config.bangumiImage.host)}/poster`
    : "https://anime-img.5t5.top/assets/noposter.png";

  await db
    .update(anime)
    .set({ poster })
    .where(eq(anime.bgmid, String(bgmID)));
}
