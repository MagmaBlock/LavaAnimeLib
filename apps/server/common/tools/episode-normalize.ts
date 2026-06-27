import type { StructuredEpisode } from "@lavaanime/shared";

/**
 * 集数归一化纯函数: 把"季内编号"映射到"绝对编号空间"。
 *
 * 规则: 若 n < start, 视为按上一季续编, 输出 n + (start - 1); 否则原样保留。
 * 例如 start=13: 1->13, 12->24, 13->13。
 * start<=1 或 null/undefined 时无偏移, 原样返回。
 * 非数字 / 含非数字小数 / 其它无法解析的形态原样返回, 不做猜测。
 */
export function normalizeEpisodeNumber(
  input: string | number | null | undefined,
  start: number | null | undefined
): string | undefined {
  if (input == null) return undefined;
  if (start == null || start <= 1) {
    return typeof input === "number" ? String(input) : input;
  }

  const raw = typeof input === "number" ? String(input) : input;
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return raw;

  const intPart = parseInt(match[1], 10);
  if (!Number.isFinite(intPart) || intPart < 1 || intPart >= start) {
    return raw;
  }

  const newInt = intPart + (start - 1);
  return match[2] != null ? `${newInt}.${match[2]}` : String(newInt);
}

/**
 * 把本篇剧集列表(type=0)的 sort 归一化到绝对编号空间, 用于前端展示与点击高亮对齐。
 * 非本篇 (SP/OP/ED) 不归一化, 保持 Bangumi 原 sort。
 */
export function normalizeStructuredEpisodes(
  episodes: StructuredEpisode[],
  start: number | null | undefined
): StructuredEpisode[] {
  if (!start || start <= 1) return episodes;
  return episodes.map((ep) =>
    ep.type === 0
      ? { ...ep, sort: normalizeAbsoluteNumber(ep.sort, start) }
      : ep
  );
}

/**
 * 数值版归一化, 用于 sort (数字)。返回数字。
 */
export function normalizeAbsoluteNumber(
  n: number,
  start: number | null | undefined
): number {
  if (start == null || start <= 1) return n;
  if (!Number.isFinite(n) || n < 1 || n >= start) return n;
  return n + (start - 1);
}

/**
 * 把文件名解析出的 episode (季内编号) 映射为绝对编号。
 * 同时处理剧场版 / OVA 单集情况: 若 Bangumi subject.eps == 1 且文件为视频但未解析到集数,
 * 直接分配到唯一的绝对号按钮 (padStart 后的 episode_start, 默认 "01")。
 *
 * 返回 undefined 表示该文件不归属于任何集按钮 (由前端归入"无集数"桶)。
 *
 * @param rawEpisode parseResult.episode (string)
 * @param fileType parseResult.extensionName.type ("video" / "music" / ...)
 * @param info 该 anime 的 episode_start 与 subjects.eps
 */
export function resolveFileEpisode(
  rawEpisode: string | undefined,
  fileType: string | null | undefined,
  info: { episode_start: number | null; eps: number | null }
): string | undefined {
  if (rawEpisode != null && rawEpisode !== "") {
    return normalizeEpisodeNumber(rawEpisode, info.episode_start);
  }
  // 单集条目 (剧场版 / OVA): 无集数视频文件归并到唯一按钮
  if (info.eps === 1 && fileType === "video") {
    const start = info.episode_start ?? 1;
    return String(start).padStart(2, "0");
  }
  return undefined;
}