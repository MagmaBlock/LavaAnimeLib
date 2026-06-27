// Bangumi API v0 响应类型
// 基于 https://github.com/bangumi/api/blob/master/open-api/v0.yaml

export interface BangumiImages {
  large: string;
  common: string;
  medium: string;
  small: string;
  grid: string;
}

export interface BangumiRating {
  rank: number;
  total: number;
  count: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
    "6": number;
    "7": number;
    "8": number;
    "9": number;
    "10": number;
  };
  score: number;
}

export interface BangumiCollection {
  wish: number;
  collect: number;
  doing: number;
  on_hold: number;
  dropped: number;
}

export interface BangumiTag {
  name: string;
  count: number;
}

export type BangumiInfoboxValue =
  | string
  | Array<{ k: string; v: string } | { v: string }>;

export interface BangumiInfoboxItem {
  key: string;
  value: BangumiInfoboxValue;
}

/** `/v0/subjects/{subject_id}` 响应 */
export interface BangumiSubject {
  id: number;
  type: number;
  name: string;
  name_cn: string;
  summary: string;
  nsfw: boolean;
  locked: boolean;
  platform: string;
  meta_tags: string[];
  volumes: number;
  eps: number;
  series: boolean;
  total_episodes: number;
  rating: BangumiRating;
  images: BangumiImages;
  collection: BangumiCollection;
  tags: BangumiTag[];
  date?: string;
  infobox?: BangumiInfoboxItem[];
}

/** `/v0/subjects/{subject_id}/subjects` 响应 */
export interface BangumiSubjectRelation {
  id: number;
  type: number;
  name: string;
  name_cn: string;
  relation: string;
  images?: BangumiImages;
}

export interface PersonImages {
  large: string;
  medium: string;
  small: string;
  grid: string;
}

export interface BangumiPerson {
  id: number;
  name: string;
  type: number;
  career: string[];
  images?: PersonImages;
  short_summary: string;
  locked: boolean;
}

/** `/v0/subjects/{subject_id}/characters` 响应 */
export interface BangumiRelatedCharacter {
  id: number;
  name: string;
  type: number;
  relation: string;
  images?: PersonImages;
  actors?: BangumiPerson[];
  summary?: string;
  name_cn?: string;
}

/** `/v0/episodes?subject_id=` 响应 */
export interface BangumiEpisode {
  id: number;
  type: number;
  name: string;
  name_cn: string;
  sort: number;
  ep?: number;
  airdate?: string;
  duration?: string;
  desc?: string;
  status?: string;
  subject_id: number;
}

// --- 内部结构化类型（重构后的新格式） ---

export interface StructuredImages {
  large?: string | null;
  common?: string | null;
  medium?: string | null;
  small?: string | null;
  grid?: string | null;
}

export interface StructuredRating {
  score?: number | null;
  rank?: number | null;
  total?: number | null;
  counts?: Array<{ star: number; count: number }>;
}

export interface StructuredTag {
  name: string;
  count: number;
}

export interface StructuredInfoboxItem {
  key: string;
  sub_key?: string | null;
  value: string;
  sort_order: number;
}

export interface StructuredEpisode {
  id: number;
  bgm_ep_id?: number | null;
  type: number;
  sort: number;
  ep?: number | null;
  name?: string | null;
  name_cn?: string | null;
  airdate?: string | null;
  duration?: string | null;
  desc?: string | null;
  status?: string | null;
}

export interface StructuredPerson {
  id: number;
  name: string;
  type?: number | null;
  short_summary?: string | null;
  locked: boolean;
  images?: PersonImages;
  careers: string[];
}

export interface StructuredCharacter {
  id: number;
  name: string;
  name_cn?: string | null;
  type?: number | null;
  summary?: string | null;
  images?: PersonImages;
  relation: string;
  actors: StructuredPerson[];
}

// --- 番剧库内部组合类型 ---

export interface AnimeBase {
  id: number;
  bgmID?: number;
  index: { year: string; type: string; name: string };
  views: number;
  title: string;
  type: { bdrip: boolean; nsfw: boolean };
  images: Partial<BangumiImages> & { poster?: string };
  deleted: boolean;
  /**
   * 绝对集数起始号。用于把不同字幕组/不同 Bangumi 续作的集数对齐到同一编号空间。
   * 例如第二季前一季 12 话, 则 episode_start = 13, 低于 13 的集数会被加 12 归一化。
   * NULL 表示尚未计算（自动取默认 1, 等同无偏移）。
   */
  episode_start?: number | null;
}

export interface AnimeRelation extends AnimeBase {
  relation: string;
}

/**
 * /v2/anime/get?full=true 返回的完整番剧数据
 * 包含旧字段（向后兼容）和新结构化字段
 */
export interface AnimeDetail
  extends Omit<BangumiSubject, "id" | "type" | "images">,
    AnimeBase {
  relations: AnimeRelation[];
  characters: BangumiRelatedCharacter[];

  /** 结构化数据（新） */
  structured?: {
    rating: StructuredRating;
    tags: StructuredTag[];
    meta_tags: string[];
    ep_count: number;
    infobox: StructuredInfoboxItem[];
    episodes: StructuredEpisode[];
    characters: StructuredCharacter[];
    // 向后兼容的旧格式也在顶层保留
    collection: {
      wish: number;
      collect: number;
      doing: number;
      on_hold: number;
      dropped: number;
    };
  };
}

// --- Bangumi Wiki detail types ---

export interface BangumiWikiCharacterResult {
  id: number;
  name: string;
  name_cn: string | null;
  type: number | null;
  summary: string | null;
  images: StructuredImages | null;
  subjects: Array<{
    anime_id: number | null;
    bgmid: number;
    name: string;
    name_cn: string | null;
    poster: string | null;
    relation: string | null;
    actors: Array<{
      id: number;
      name: string;
      images: StructuredImages | null;
      careers: string[];
    }>;
  }>;
}

export interface BangumiWikiPersonResult {
  id: number;
  name: string;
  type: number | null;
  short_summary: string | null;
  locked: boolean;
  images: StructuredImages | null;
  careers: string[];
  characters: Array<{
    character_id: number;
    name: string;
    name_cn: string | null;
    images: StructuredImages | null;
    relation: string | null;
    subject: {
      anime_id: number | null;
      bgmid: number;
      name: string;
      name_cn: string | null;
      poster: string | null;
    } | null;
  }>;
}
