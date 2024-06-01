import { $Fetch, ofetch } from "ofetch";

/**
 * 对 BangumiAPI 的实现
 * https://bangumi.github.io/api/#/
 */
export class BangumiAPI {
  private apiHost: string;
  private api: $Fetch;

  constructor(apiHost: string = "https://api.bgm.tv") {
    this.apiHost = apiHost;
    this.api = ofetch.create({
      baseURL: this.apiHost,
      headers: { "User-Agent": "LavaAnimeLibServer/3.0" },
      timeout: 15000,
      retry: 3,
      retryDelay: 1000,
      responseType: "json",
    });
  }

  getSubjects(id: number) {
    return this.api<BangumiAPISubject>(`/v0/subjects/${id}`);
  }

  getSubjectsPersons(id: number) {
    return this.api<BangumiAPISubjectPersons>(`/v0/subjects/${id}/persons`);
  }

  getSubjectsCharacters(id: number) {
    return this.api<BangumiAPISubjectCharacters>(
      `/v0/subjects/${id}/characters`
    );
  }

  getSubjectsSubjects(id: number) {
    return this.api<BangumiAPISubjectSubjects>(`/v0/subjects/${id}/subjects`);
  }

  /**
   * Get Episodes
   * /v0/episodes
   * @param id 条目 ID
   * @param type 参照章节的 `type`
   * - Legacy_EpisodeType
   * - 章节类型
   * - 0 = 本篇
   * - 1 = 特别篇
   * - 2 = OP
   * - 3 = ED
   * - 4 = 预告/宣传/广告
   * - 5 = MAD
   * - 6 = 其他
   * @param limit 分页参数
   * @param offset 分页参数
   * @returns
   */
  getEpisodes(
    subject_id: number,
    type?: number,
    limit?: number,
    offset?: number
  ) {
    return this.api<BangumiAPIEpisodes>(`/v0/episodes`, {
      params: { subject_id, type, limit, offset },
    });
  }

  getEpisode(episodeId: number) {
    return this.api<BangumiAPIEpisode>(`/v0/episodes/${episodeId}`);
  }
}

export type BangumiAPISubject = {
  date: string;
  platform: string;
  images: {
    small: string;
    grid: string;
    large: string;
    medium: string;
    common: string;
  };
  summary: string;
  name: string;
  name_cn: string;
  tags: Array<{
    name: string;
    count: number;
  }>;
  infobox: Array<{
    key: string;
    value: any;
  }>;
  rating: {
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
  };
  total_episodes: number;
  collection: {
    on_hold: number;
    dropped: number;
    wish: number;
    collect: number;
    doing: number;
  };
  id: number;
  eps: number;
  volumes: number;
  locked: boolean;
  nsfw: boolean;
  type: number;
};

export type BangumiAPISubjectPersons = Array<{
  images: {
    small: string;
    grid: string;
    large: string;
    medium: string;
  };
  name: string;
  relation: string;
  career: Array<string>;
  type: number;
  id: number;
}>;

export type BangumiAPISubjectCharacters = Array<{
  images: {
    small: string;
    grid: string;
    large: string;
    medium: string;
  };
  name: string;
  relation: string;
  actors: Array<{
    images: {
      small: string;
      grid: string;
      large: string;
      medium: string;
    };
    name: string;
    short_summary: string;
    career: Array<string>;
    id: number;
    type: number;
    locked: boolean;
  }>;
  type: number;
  id: number;
}>;

export type BangumiAPISubjectSubjects = Array<{
  images: {
    small: string;
    grid: string;
    large: string;
    medium: string;
    common: string;
  };
  name: string;
  name_cn: string;
  relation: string;
  type: number;
  id: number;
}>;

export type BangumiAPIEpisodes = {
  data: Array<BangumiAPIEpisode>;
  total: number;
  limit: number;
  offset: number;
};

export type BangumiAPIEpisode = {
  airdate: string;
  name: string;
  name_cn: string;
  duration: string;
  desc: string;
  ep: number;
  sort: number;
  id: number;
  subject_id: number;
  comment: number;
  type: number;
  disc: number;
  duration_seconds: number;
};
