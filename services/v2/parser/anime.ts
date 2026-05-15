import _ from "lodash";
import config from "../../../common/config.js";
import { db } from "../../../common/database/connection.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { inArray } from "drizzle-orm";
import { getAnimesByBgmID } from "../anime/index.js";

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

interface ParsedAnime {
  id: number;
  bgmID?: number;
  index: { year: string; type: string; name: string };
  views: number;
  title: string;
  type: { bdrip: boolean; nsfw: boolean };
  images: Record<string, string | undefined>;
  deleted: boolean;
  [key: string]: unknown;
}

interface BgmDataEntry {
  relations: Record<string, unknown>[];
  subjects: Record<string, unknown>;
  characters: unknown[];
}

export async function parseAnime(rawData: RawAnimeRow | RawAnimeRow[], full = false): Promise<ParsedAnime[]> {
  if (!rawData) throw new Error("No data provide");
  if (typeof rawData !== "object") throw new Error("Data is not a Object");

  let dataArray = _.castArray(rawData) as RawAnimeRow[];
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
        ...(thisbgmData.subjects.images as Record<string, string | undefined>),
        poster: (thisbgmData.subjects.images as Record<string, string>).large + "/poster",
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
      } as unknown as ParsedAnime;
    }
    return thisAnimeData;
  }

  const thisAnimeData: ParsedAnime = {
    id: parseInt(String(rawData.id)),
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

    for (const i in queryResult) {
      for (const j in queryResult[i]) {
        const val = (queryResult[i] as Record<string, unknown>)[j];
        if (typeof val === "string") {
          (queryResult[i] as Record<string, unknown>)[j] = val.replace(
            /https:\/\/lain\.bgm\.tv/gi,
            config.bangumiImage.host
          );
        }
      }
      bgmData[queryResult[i].bgmid] = {
        relations: JSON.parse(queryResult[i].relations_anime!),
        subjects: JSON.parse(queryResult[i].subjects!),
        characters: JSON.parse(queryResult[i].characters!),
      };
    }
  }
  return bgmData;
}

async function parseBangumiRelations(relations: Record<string, unknown>[]) {
  const parsedRelations = [];
  for (const i in relations) {
    const thisBgmIDAnimes = await getAnimesByBgmID(relations[i].id as number);
    for (const j in thisBgmIDAnimes) {
      parsedRelations.push({
        ...thisBgmIDAnimes[j],
        relation: relations[i].relation,
      });
    }
  }
  return parsedRelations;
}
