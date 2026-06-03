import _ from "lodash";
import type {
  BangumiSubject,
  BangumiSubjectRelation,
  BangumiRelatedCharacter,
  AnimeDetail,
  AnimeBase,
  AnimeRelation,
} from "@lavaanime/shared";
import config from "../../../common/env.js";
import { db } from "../../../common/database/connection.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { inArray } from "drizzle-orm";
import { getAnimesByBgmID } from "../anime/index.js";
import { ensureBangumiCache } from "../bangumi/cache.js";

interface RawAnimeRow {
  id: number | string;
  bgmid?: string | number | null;
  year: string;
  type: string;
  name: string;
  views: number;
  title?: string | null;
  poster?: string | null;
  deleted?: number;
  nsfw?: number;
  [key: string]: unknown;
}

export type { RawAnimeRow };

/**
 * 解析器内部类型：full=true 时为完整 AnimeDetail，full=false 时仅含 AnimeBase 字段
 */
interface ParsedAnime
  extends Partial<Omit<BangumiSubject, "id" | "type" | "images">>,
    AnimeBase {
  relations?: AnimeRelation[];
  characters?: BangumiRelatedCharacter[];
  [key: string]: unknown;
}

export type { ParsedAnime };

interface BgmDataEntry {
  relations: BangumiSubjectRelation[];
  subjects: BangumiSubject;
  characters: BangumiRelatedCharacter[];
}

export async function parseAnime(rawData: RawAnimeRow | RawAnimeRow[], full = false): Promise<ParsedAnime[]> {
  if (!rawData) throw new Error("No data provide");
  if (typeof rawData !== "object") throw new Error("Data is not a Object");

  let dataArray = Array.isArray(rawData) ? rawData : [rawData];
  dataArray = _.compact(dataArray);
  const bgmIDList = parseAllBgmID(dataArray);
  const bgmData = await getAllBangumiData(bgmIDList);
  const parseResults: ParsedAnime[] = [];

  for (const i in dataArray) {
    parseResults.push(await parseSingleAnimeData(dataArray[i], bgmData, full));
  }

  return parseResults;
}

async function parseSingleAnimeData(
  rawData: RawAnimeRow,
  bgmData: Record<string, BgmDataEntry>,
  full = false
): Promise<ParsedAnime> {
  if (parseInt(String(rawData.bgmid))) {
    const thisbgmData = bgmData[Number(rawData.bgmid)];
    if (!thisbgmData?.subjects) {
      await ensureBangumiCache(Number(rawData.bgmid));
      return parseSingleAnimeWithoutBangumiData(rawData);
    }

    const thisAnimeData: ParsedAnime = {
      id: parseInt(String(rawData.id)),
      bgmID: parseInt(String(rawData.bgmid)),
      index: {
        year: rawData.year,
        type: rawData.type,
        name: rawData.name,
      },
      views: rawData.views,
      title: (rawData.title || "").replace(/\[BDRip\]|\[NSFW\]/gi, ""),
      type: {
        bdrip: /\[BDRip\]/i.test(rawData.title || ""),
        nsfw: /\[NSFW\]/i.test(rawData.title || ""),
      },
      images: {
        ...thisbgmData.subjects.images,
        poster: thisbgmData.subjects.images.large
          ? thisbgmData.subjects.images.large + "/poster"
          : undefined,
      },
      deleted: false,
    };
    if (full) {
      const newRelations = await parseBangumiRelations(thisbgmData.relations);
      return {
        ...thisbgmData.subjects,
        ...thisAnimeData,
        relations: newRelations,
        characters: thisbgmData.characters,
      };
    }
    return thisAnimeData;
  }

  return parseSingleAnimeWithoutBangumiData(rawData);
}

function parseSingleAnimeWithoutBangumiData(rawData: RawAnimeRow): ParsedAnime {
  const thisAnimeData: ParsedAnime = {
    id: parseInt(String(rawData.id)),
    bgmID: parseInt(String(rawData.bgmid)) || undefined,
    index: {
      year: rawData.year,
      type: rawData.type,
      name: rawData.name,
    },
    views: rawData.views,
    title: (rawData.title || "").replace(/\[BDRip\]|\[NSFW\]/gi, ""),
    type: {
      bdrip: /\[BDRip\]/i.test(rawData.title || ""),
      nsfw: /\[NSFW\]/i.test(rawData.title || ""),
    },
    images: {
      small: rawData.poster || undefined,
      grid: rawData.poster || undefined,
      large: rawData.poster || undefined,
      medium: rawData.poster || undefined,
      common: rawData.poster || undefined,
      poster: rawData.poster || undefined,
    },
    deleted: false,
  };

  return thisAnimeData;
}

function parseAllBgmID(data: RawAnimeRow[]): number[] {
  const bgmIDList: number[] = [];
  for (const i in data) {
    const thisBgmId = parseInt(String(data[i].bgmid));
    if (thisBgmId) bgmIDList.push(thisBgmId);
  }
  return bgmIDList;
}

async function getAllBangumiData(bgmIDList: number[]): Promise<Record<string, BgmDataEntry>> {
  const bgmData: Record<string, BgmDataEntry> = {};
  if (bgmIDList.length > 0) {
    const queryResult = await db
      .select()
      .from(bangumiData)
      .where(inArray(bangumiData.bgmid, bgmIDList));

    for (const row of queryResult) {
      if (row.relations_anime) {
        row.relations_anime = row.relations_anime.replace(
          /https:\/\/lain\.bgm\.tv/gi,
          config.bangumiImage.host
        );
      }
      if (row.subjects) {
        row.subjects = row.subjects.replace(
          /https:\/\/lain\.bgm\.tv/gi,
          config.bangumiImage.host
        );
      }
      if (row.characters) {
        row.characters = row.characters.replace(
          /https:\/\/lain\.bgm\.tv/gi,
          config.bangumiImage.host
        );
      }
      bgmData[row.bgmid] = {
        relations: JSON.parse(row.relations_anime!) as BangumiSubjectRelation[],
        subjects: JSON.parse(row.subjects!) as BangumiSubject,
        characters: JSON.parse(row.characters!) as BangumiRelatedCharacter[],
      };
    }
  }
  return bgmData;
}

async function parseBangumiRelations(
  relations: BangumiSubjectRelation[]
): Promise<AnimeRelation[]> {
  const parsedRelations: AnimeRelation[] = [];
  for (const relation of relations) {
    const thisBgmIDAnimes = await getAnimesByBgmID(Number(relation.id));
    for (const anime of thisBgmIDAnimes) {
      parsedRelations.push({
        ...(anime as unknown as AnimeBase),
        relation: relation.relation,
      });
    }
  }
  return parsedRelations;
}
