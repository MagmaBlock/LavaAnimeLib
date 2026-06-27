import { eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { computeEpisodeStart } from "../bangumi/episode-start.js";

/**
 * 管理员覆盖某 anime 的 episode_start。
 * - 传入 number: 设为管理员覆盖值, 后续 sync 不会改写。
 * - 传入 null/undefined: 清除覆盖并立即重新自动计算后回填 (若算 > 1 才写入, 否则置 NULL)。
 */
export async function setAnimeEpisodeStart(
  laID: number,
  episodeStart: number | null | undefined
): Promise<number | null> {
  if (episodeStart != null) {
    await db
      .update(anime)
      .set({ episode_start: episodeStart })
      .where(eq(anime.id, laID));
    return episodeStart;
  }

  // 清除: 置 NULL
  await db
    .update(anime)
    .set({ episode_start: null })
    .where(eq(anime.id, laID));

  // 立即重新自动计算
  const [row] = await db
    .select({ bgmid: anime.bgmid })
    .from(anime)
    .where(eq(anime.id, laID))
    .limit(1);

  const bgmidNum = row?.bgmid != null ? parseInt(String(row.bgmid), 10) : NaN;
  if (!Number.isFinite(bgmidNum) || bgmidNum <= 0) return null;

  const start = await computeEpisodeStart(bgmidNum);
  if (start > 1) {
    await db
      .update(anime)
      .set({ episode_start: start })
      .where(eq(anime.id, laID));
    return start;
  }
  return null;
}