import { eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { computeEpisodeStart } from "../bangumi/episode-start.js";
import { and, like, or, sql, desc, asc } from "drizzle-orm";

export interface ListAnimeAdminOptions {
  page: number;
  pageSize: number;
  search?: string;
  deleted?: number;
}

export interface AnimeListItem {
  id: number;
  year: string;
  type: string;
  name: string;
  views: number;
  bgmid: string | null;
  nsfw: number;
  title: string | null;
  deleted: number;
  poster: string | null;
  episode_start: number | null;
  episode_start_manual: 0 | 1;
}

/** 管理员可编辑的字段白名单 (排除 id / episode_start* 等受控字段) */
export type AnimeUpdatePatch = Partial<
  Pick<
    typeof anime.$inferSelect,
    "year" | "type" | "name" | "bgmid" | "nsfw" | "title" | "deleted" | "poster" | "views"
  >
>;

export interface AnimeAdminRow {
  id: number;
  year: string;
  type: string;
  name: string;
  views: number;
  bgmid: string | null;
  nsfw: number;
  title: string | null;
  deleted: number;
  poster: string | null;
  episode_start: number | null;
  episode_start_manual: 0 | 1;
}

/**
 * 管理员覆盖某 anime 的 episode_start。
 *
 * @param manual true = 手动覆盖 (写入 episode_start 并置 manual=1, sync 永不改写)
 *               false = 恢复自动 (置 manual=0 并立即重算回填)
 * @param episodeStart 仅当 manual=true 时需要, 必须为正整数
 * @returns 更新后的 episode_start 值 (null 表示 auto 且算出 <= 1)
 * @throws Error("番剧不存在") 当 laID 找不到对应行
 */
export async function setAnimeEpisodeStart(
  laID: number,
  manual: boolean,
  episodeStart?: number | null
): Promise<number | null> {
  const [row] = await db
    .select({ bgmid: anime.bgmid })
    .from(anime)
    .where(eq(anime.id, laID))
    .limit(1);
  if (!row) throw new Error("番剧不存在");

  if (manual) {
    if (typeof episodeStart !== "number" || !Number.isInteger(episodeStart) || episodeStart < 1) {
      throw new Error("手动覆盖必须提供 >= 1 的整数");
    }
    await db
      .update(anime)
      .set({ episode_start: episodeStart, episode_start_manual: 1 })
      .where(eq(anime.id, laID));
    return episodeStart;
  }

  // 恢复 auto: 先重算 (只读, 不依赖任何写入), 再用单条 UPDATE 同时置 manual=0 与回填值,
  // 避免分两步写时中途抛错导致 manual=0 但 episode_start 仍为旧覆盖值的脏状态。
  const bgmidNum = row.bgmid != null ? parseInt(String(row.bgmid), 10) : NaN;
  const start =
    Number.isFinite(bgmidNum) && bgmidNum > 0
      ? await computeEpisodeStart(bgmidNum)
      : null;
  await db
    .update(anime)
    .set({ episode_start_manual: 0, episode_start: start })
    .where(eq(anime.id, laID));
  return start;
}

export interface AnimeEpisodeStartAdmin {
  id: number;
  name: string;
  bgmid: string | null;
  episode_start: number | null;
  /** 0 = auto, 1 = manual */
  episode_start_manual: 0 | 1;
}

/**
 * 查询单个 anime 的 episode_start 元信息。
 * 不存在时返回 null。
 */
export async function getAnimeEpisodeStartAdmin(
  laID: number
): Promise<AnimeEpisodeStartAdmin | null> {
  const [row] = await db
    .select({
      id: anime.id,
      name: anime.name,
      bgmid: anime.bgmid,
      episode_start: anime.episode_start,
      episode_start_manual: anime.episode_start_manual,
    })
    .from(anime)
    .where(eq(anime.id, laID))
    .limit(1);
  if (!row) return null;
    return {
      ...row,
      episode_start_manual: row.episode_start_manual === 1 ? 1 : 0,
    };
}

/**
 * 查询单个 anime 的全部可编辑字段, 供后台表单回填。
 * 不存在时返回 null。
 */
export async function getAnimeAdmin(
  laID: number
): Promise<AnimeAdminRow | null> {
  const [row] = await db.select().from(anime).where(eq(anime.id, laID)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    year: row.year,
    type: row.type,
    name: row.name,
    views: row.views,
    bgmid: row.bgmid,
    nsfw: row.nsfw,
    title: row.title,
    deleted: row.deleted,
    poster: row.poster,
    episode_start: row.episode_start,
    episode_start_manual: row.episode_start_manual === 1 ? 1 : 0,
  };
}

/**
 * 分页列表, 供后台浏览定位。search 为纯数字时按 laID 精确 + bgmid 模糊;
 * 否则按 name / title 模糊匹配。deleted 不传则含全部。
 */
export async function listAnimeAdmin(
  options: ListAnimeAdminOptions
): Promise<{ list: AnimeListItem[]; total: number }> {
  const { page, pageSize, search, deleted } = options;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (deleted === 0 || deleted === 1) {
    conditions.push(eq(anime.deleted, deleted));
  }
  if (search) {
    const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
    if (/^\d+$/.test(search)) {
      const num = Number(search);
      conditions.push(
        or(eq(anime.id, num), like(anime.bgmid, `%${escaped}%`), like(anime.name, `%${escaped}%`))
      );
    } else {
      conditions.push(or(like(anime.name, `%${escaped}%`), like(anime.title, `%${escaped}%`), like(anime.bgmid, `%${escaped}%`)));
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(anime)
      .where(where)
      .orderBy(desc(anime.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(anime)
      .where(where)
      .then((r) => Number(r[0].count)),
  ]);

  const list: AnimeListItem[] = rows.map((row) => ({
    id: row.id,
    year: row.year,
    type: row.type,
    name: row.name,
    views: row.views,
    bgmid: row.bgmid,
    nsfw: row.nsfw,
    title: row.title,
    deleted: row.deleted,
    poster: row.poster,
    episode_start: row.episode_start,
    episode_start_manual: row.episode_start_manual === 1 ? 1 : 0,
  }));

  return { list, total: countResult };
}

/**
 * 管理员更新 anime 的基本字段 (PATCH 语义: 仅写入传入字段)。
 *
 * @param patch 仅包含白名单内字段; id / episode_start* 等受控字段不在此处处理
 * @returns 更新后的完整行
 * @throws Error("番剧不存在") 当 laID 找不到对应行
 */
export async function updateAnime(
  laID: number,
  patch: AnimeUpdatePatch
): Promise<AnimeAdminRow> {
  const existing = await getAnimeAdmin(laID);
  if (!existing) throw new Error("番剧不存在");

  // 过滤 undefined, 只写入显式提供的字段
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(anime).set(updates).where(eq(anime.id, laID));
  }

  const refreshed = await getAnimeAdmin(laID);
  return refreshed!;
}
