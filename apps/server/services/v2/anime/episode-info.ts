import { eq, and } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";

export interface AnimeEpisodeInfo {
  /** 绝对集数起始号; null 表示未设置 (无偏移) */
  episode_start: number | null;
  /** Bangumi subject.eps 字段, 表示该条目本篇总集数; null 表示无对应 Bangumi 数据 */
  eps: number | null;
}

/**
 * 取一个 laID 对应的集数元信息:
 * - anime.episode_start (管理员覆盖或 sync 自动回填)
 * - subjects.eps (Bangumi 条目本篇总集数, 用于 OVA 单集判定)
 *
 * 仅一次 anime→subjects 联表查询 (相同 bgmid)。
 */
export async function getAnimeEpisodeInfo(
  laID: number
): Promise<AnimeEpisodeInfo> {
  const [row] = await db
    .select({
      episode_start: anime.episode_start,
      bgmid: anime.bgmid,
    })
    .from(anime)
    .where(and(eq(anime.id, laID)))
    .limit(1);

  if (!row) return { episode_start: null, eps: null };

  const bgmidNum = row.bgmid != null ? parseInt(String(row.bgmid), 10) : NaN;
  if (!Number.isFinite(bgmidNum) || bgmidNum <= 0) {
    return { episode_start: row.episode_start ?? null, eps: null };
  }

  const [sub] = await db
    .select({ eps: subjects.eps })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmidNum))
    .limit(1);

  return {
    episode_start: row.episode_start ?? null,
    eps: sub?.eps ?? null,
  };
}