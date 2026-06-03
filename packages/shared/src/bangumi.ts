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
}

export interface AnimeRelation extends AnimeBase {
  relation: string;
}

/**
 * /v2/anime/get?full=true 返回的完整番剧数据
 * 由 Bangumi Subject 字段 + Anime 自有字段 + relations/characters 组成
 */
export interface AnimeDetail
  extends Omit<BangumiSubject, "id" | "type" | "images">,
    AnimeBase {
  relations: AnimeRelation[];
  characters: BangumiRelatedCharacter[];
}
