import { eq, inArray, and, isNull } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";
import { subjectRelations } from "../../../common/database/schema/bangumi-subject-relations.js";
import { subjectEpisodes } from "../../../common/database/schema/bangumi-episodes.js";
import { anime } from "../../../common/database/schema/anime.js";
import { log } from "../../../common/tools/logger.js";

/** 视为"前传"的关系类型。Bangumi 中文关系串, 大小写不敏感做包含匹配。 */
const PREQUEL_PATTERNS = ["前传", "前作", "prequel"];

function isPrequel(relationType: string | null | undefined): boolean {
  if (!relationType) return false;
  const lower = relationType.toLowerCase();
  return PREQUEL_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

/**
 * 计算某 Bangumi subject 的绝对集数起始号 episode_start。
 *
 * 优先级:
 * 1) 管理员覆盖: anime.episode_start 不为 null 即视为已覆盖, 直接返回 (调用方需自行先检查, 这里只算自动值)
 * 2) Bangumi 已续接: 本篇(type=0) episode 的最小 sort > 1, 直接用该 sort;
 *    Bangumi 经常会自动把续作的 sort 接到上一季后面 (例 S1=1..12, S2=25..48),
 *    这是最稳定的来源, 优于自己爬前传链累加。
 * 3) 前传链累加: 递归沿"前传"关系上溯, 把每个前传的本篇集数累加, start = 1 + Σ。
 *    前传为电影 / OVA / Web 动画同样累加其本篇(type=0)集数。
 *    存在分叉时按可到达的前传链集合求和 (主链), 忽略成环。
 * 4) 算不出 (无前传 / 无数据) 返回 1, 等同无偏移。
 *
 * 本函数只读 DB, 不修改任何数据。
 */
export async function computeEpisodeStart(bgmID: number): Promise<number> {
  // 1) Bangumi 已续接 sort
  const epStartFromSort = await getMinMainSortFromDB(bgmID);
  if (epStartFromSort != null && epStartFromSort > 1) {
    return epStartFromSort;
  }

  // 2) 前传链累加
  const accumulated = await accumulatePrequelEpisodes(bgmID, new Set());
  if (accumulated > 0) {
    return accumulated + 1;
  }

  return 1;
}

/** 返回某 subject 本篇(type=0) episode 的最小 sort; 无本篇数据返回 null。 */
async function getMinMainSortFromDB(bgmID: number): Promise<number | null> {
  const [sub] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);
  if (!sub) return null;

  const rows = await db
    .select({ sort: subjectEpisodes.sort })
    .from(subjectEpisodes)
    .where(
      and(eq(subjectEpisodes.subject_id, sub.id), eq(subjectEpisodes.type, 0))
    );
  if (rows.length === 0) return null;

  const mainSorts = rows
    .map((r) => Number(r.sort))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (mainSorts.length === 0) return null;

  return Math.min(...mainSorts);
}

/**
 * 递归累加前传的本篇集数总和。
 * visited 用于成环防护。前传指 *本* subject 的 relations 中关系类型为"前传"的对端,
 * 即对端是本条目的前传 (前作)。
 */
async function accumulatePrequelEpisodes(
  bgmID: number,
  visited: Set<number>
): Promise<number> {
  if (visited.has(bgmID)) return 0;
  visited.add(bgmID);

  // 找本 subject 的内部 id
  const [sub] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);
  if (!sub) return 0;

  // 本 subject 的关系: 找出指向"前传"的对端 bgmid
  const relRows = await db
    .select({
      related_bgmid: subjectRelations.related_bgmid,
      relation_type: subjectRelations.relation_type,
    })
    .from(subjectRelations)
    .where(eq(subjectRelations.subject_id, sub.id));

  const prequelBgmIDs = relRows
    .filter((r) => isPrequel(r.relation_type))
    .map((r) => r.related_bgmid);

  if (prequelBgmIDs.length === 0) return 0;

  // 批量计算每个前传的本篇集数 (从 bangumi_episodes 取 type=0 计数)
  const prequelSubRows = await db
    .select({ id: subjects.id, bgmid: subjects.bgmid })
    .from(subjects)
    .where(inArray(subjects.bgmid, prequelBgmIDs));

  const subjectIdToBgm = new Map(prequelSubRows.map((r) => [r.id, r.bgmid]));
  const prequelSubjectIds = prequelSubRows.map((r) => r.id);

  let total = 0;
  if (prequelSubjectIds.length > 0) {
    const epRows = await db
      .select({
        subject_id: subjectEpisodes.subject_id,
      })
      .from(subjectEpisodes)
      .where(
        and(
          inArray(subjectEpisodes.subject_id, prequelSubjectIds),
          eq(subjectEpisodes.type, 0)
        )
      );

    // 每个前传 subject 的本篇 episode 行数 = 该作的"集数" (Bangumi 一个本篇 episode 一行)
    const lineCountBySubject = new Map<number, number>();
    for (const r of epRows) {
      lineCountBySubject.set(
        r.subject_id,
        (lineCountBySubject.get(r.subject_id) ?? 0) + 1
      );
    }

    for (const prequelSubjectId of prequelSubjectIds) {
      const cnt = lineCountBySubject.get(prequelSubjectId) ?? 0;
      const prequelBgm = subjectIdToBgm.get(prequelSubjectId);
      // 本前传自身的本篇集数 + 该前传再往上的前传链
      total += cnt;
      if (prequelBgm != null) {
        total += await accumulatePrequelEpisodes(prequelBgm, visited);
      }
    }
  }

  return total;
}

/**
 * 在 syncEpisode 之后回填 anime.episode_start。
 * 仅当 anime.episode_start IS NULL 时写入 (管理员覆盖不被改写)。
 * 一个 bgmid 可能对应多个 anime 行, 全部回填同一值。
 */
export async function backfillEpisodeStart(bgmID: number): Promise<void> {
  try {
    const start = await computeEpisodeStart(bgmID);
    await db
      .update(anime)
      .set({ episode_start: start })
      .where(and(eq(anime.bgmid, String(bgmID)), isNull(anime.episode_start)));
    log.info("回填 episode_start=%d for bgm%d", start, bgmID);
  } catch (err) {
    log.warn(err, `回填 episode_start 失败: bgmID=${bgmID}`);
  }
}