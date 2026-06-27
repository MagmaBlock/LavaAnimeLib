import { eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { computeEpisodeStart } from "../bangumi/episode-start.js";

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