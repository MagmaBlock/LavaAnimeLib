import _ from "lodash";
import type {
  BangumiSubject,
  BangumiSubjectRelation,
  BangumiRelatedCharacter,
  AnimeDetail,
  AnimeBase,
  AnimeRelation,
  StructuredRating,
  StructuredTag,
  StructuredInfoboxItem,
  StructuredEpisode,
  StructuredCharacter,
  BangumiInfoboxItem,
} from "@lavaanime/shared";
import config from "../../../common/env.js";
import { db } from "../../../common/database/connection.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { subjects } from "../../../common/database/schema/subjects.js";
import { subjectAliases } from "../../../common/database/schema/subject-aliases.js";
import { subjectTags } from "../../../common/database/schema/subject-tags.js";
import { subjectMetaTags } from "../../../common/database/schema/subject-meta-tags.js";
import { subjectRatingCounts } from "../../../common/database/schema/subject-rating-counts.js";
import { subjectInfobox } from "../../../common/database/schema/subject-infobox.js";
import { subjectEpisodes } from "../../../common/database/schema/subject-episodes.js";
import { subjectCharacters } from "../../../common/database/schema/subject-characters.js";
import { characters as charactersTable } from "../../../common/database/schema/characters.js";
import { characterPersons } from "../../../common/database/schema/character-persons.js";
import { persons as personsTable } from "../../../common/database/schema/persons.js";
import { personCareers } from "../../../common/database/schema/person-careers.js";
import { sql, inArray, eq } from "drizzle-orm";
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

interface ParsedAnime
  extends Partial<Omit<BangumiSubject, "id" | "type" | "images">>,
    AnimeBase {
  relations?: AnimeRelation[];
  characters?: BangumiRelatedCharacter[];
  structured?: AnimeDetail["structured"];
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
  const structuredData = await getStructuredData(bgmIDList, full);
  const parseResults: ParsedAnime[] = [];

  for (const i in dataArray) {
    parseResults.push(await parseSingleAnimeData(dataArray[i], bgmData, structuredData, full));
  }

  return parseResults;
}

async function parseSingleAnimeData(
  rawData: RawAnimeRow,
  bgmData: Record<string, BgmDataEntry>,
  structuredData: Map<number, ReturnType<typeof buildEmptyStructured>>,
  full = false
): Promise<ParsedAnime> {
  const bgmID = parseInt(String(rawData.bgmid));
  if (bgmID) {
    const structured = structuredData.get(bgmID);
    const thisbgmData = bgmData[bgmID];

    if (!thisbgmData?.subjects && !structured) {
      await ensureBangumiCache(bgmID);
      return parseSingleAnimeWithoutBangumiData(rawData);
    }

    const images = structured?.images
      ? {
          large: structured.images.large || undefined,
          common: structured.images.common || undefined,
          medium: structured.images.medium || undefined,
          small: structured.images.small || undefined,
          grid: structured.images.grid || undefined,
          poster: structured.images.large ? structured.images.large + "/poster" : undefined,
        }
      : thisbgmData?.subjects
        ? {
            ...thisbgmData.subjects.images,
            poster: thisbgmData.subjects.images.large
              ? thisbgmData.subjects.images.large + "/poster"
              : undefined,
          }
        : {
            small: rawData.poster || undefined,
            grid: rawData.poster || undefined,
            large: rawData.poster || undefined,
            medium: rawData.poster || undefined,
            common: rawData.poster || undefined,
            poster: rawData.poster || undefined,
          };

    const thisAnimeData: ParsedAnime = {
      id: parseInt(String(rawData.id)),
      bgmID: bgmID,
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
      images,
      deleted: false,
    };

    if (full) {
      const base = thisbgmData?.subjects ?? ({} as BangumiSubject);
      const newRelations = thisbgmData?.relations
        ? await parseBangumiRelations(thisbgmData.relations)
        : [];

      const result: ParsedAnime = {
        ...base,
        ...thisAnimeData,
        relations: newRelations,
        characters: thisbgmData?.characters ?? [],
      };

      if (structured) {
        result.structured = {
          rating: structured.rating ?? { score: undefined, rank: undefined, total: undefined, counts: [] },
          tags: structured.tags,
          meta_tags: structured.meta_tags,
          ep_count: structured.ep_count,
          infobox: structured.infobox,
          episodes: structured.episodes,
          characters: structured.characters,
          collection: structured.collection,
        };

        if (structured.name) result.name = structured.name;
        if (structured.name_cn) result.name_cn = structured.name_cn;
        if (structured.summary) result.summary = structured.summary;
        if (structured.nsfw !== null) result.nsfw = structured.nsfw;
        if (structured.platform) result.platform = structured.platform;
        if (structured.date) result.date = structured.date;
        if (structured.eps !== null) result.eps = structured.eps;
        if (structured.total_episodes !== null) result.total_episodes = structured.total_episodes;
        if (structured.series !== null) result.series = structured.series;
        if (structured.tags.length > 0) {
          result.tags = structured.tags.map((t) => ({ name: t.name, count: t.count }));
        }
        if (structured.infobox.length > 0) {
          result.infobox = convertStructuredInfoboxToLegacy(structured.infobox);
        }
        if (structured.rating) {
          result.rating = {
            rank: structured.rating.rank ?? 0,
            total: structured.rating.total ?? 0,
            score: structured.rating.score ?? 0,
            count: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0 },
          };
        }
      }

      return result;
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
        relations: row.relations_anime ? (JSON.parse(row.relations_anime) as BangumiSubjectRelation[]) : [],
        subjects: row.subjects ? (JSON.parse(row.subjects) as BangumiSubject) : ({} as BangumiSubject),
        characters: row.characters ? (JSON.parse(row.characters) as BangumiRelatedCharacter[]) : [],
      };
    }
  }
  return bgmData;
}

function buildEmptyStructured() {
  return {
    name: null as string | null,
    name_cn: null as string | null,
    summary: null as string | null,
    nsfw: null as boolean | null,
    platform: null as string | null,
    date: null as string | null,
    eps: null as number | null,
    total_episodes: null as number | null,
    series: null as boolean | null,
    rating: undefined as StructuredRating | undefined,
    images: null as { large: string | null; common: string | null; medium: string | null; small: string | null; grid: string | null } | null,
    tags: [] as StructuredTag[],
    meta_tags: [] as string[],
    ep_count: 0,
    infobox: [] as StructuredInfoboxItem[],
    episodes: [] as StructuredEpisode[],
    characters: [] as StructuredCharacter[],
    collection: { wish: 0, collect: 0, doing: 0, on_hold: 0, dropped: 0 },
  };
}

async function getStructuredData(
  bgmIDList: number[],
  full: boolean
): Promise<Map<number, ReturnType<typeof buildEmptyStructured>>> {
  const result = new Map<number, ReturnType<typeof buildEmptyStructured>>();

  if (bgmIDList.length === 0) return result;

  for (const bgmID of bgmIDList) {
    result.set(bgmID, buildEmptyStructured());
  }

  const subjectRows = await db
    .select()
    .from(subjects)
    .where(inArray(subjects.bgmid, bgmIDList));

  if (subjectRows.length === 0) return result;

  const subjectIdMap = new Map<number, number>(); // bgmid → subject_id
  const subjectIds: number[] = [];

  for (const row of subjectRows) {
    const structured = result.get(row.bgmid)!;
    subjectIdMap.set(row.bgmid, row.id);
    subjectIds.push(row.id);

    structured.name = row.name;
    structured.name_cn = row.name_cn;
    structured.summary = row.summary;
    structured.nsfw = row.nsfw === 1;
    structured.platform = row.platform;
    structured.date = row.air_date;
    structured.eps = row.eps;
    structured.total_episodes = row.total_episodes;
    structured.series = row.series === 1;
    structured.rating = {
      score: row.rating_score != null ? Number(row.rating_score) : undefined,
      rank: row.rating_rank ?? undefined,
      total: row.rating_total ?? undefined,
      counts: [],
    };
    structured.images = {
      large: row.image_large,
      common: row.image_common,
      medium: row.image_medium,
      small: row.image_small,
      grid: row.image_grid,
    };
    structured.collection = {
      wish: row.collect_wish ?? 0,
      collect: row.collect_collect ?? 0,
      doing: row.collect_doing ?? 0,
      on_hold: row.collect_on_hold ?? 0,
      dropped: row.collect_dropped ?? 0,
    };
    structured.ep_count = row.eps ?? 0;
  }

  if (!full) return result;
  if (subjectIds.length === 0) return result;

  const [tags, metaTags, ratingCounts, infobox, episodes, chars] = await Promise.all([
    db.select().from(subjectTags).where(inArray(subjectTags.subject_id, subjectIds)),
    db.select().from(subjectMetaTags).where(inArray(subjectMetaTags.subject_id, subjectIds)),
    db.select().from(subjectRatingCounts).where(inArray(subjectRatingCounts.subject_id, subjectIds)),
    db.select().from(subjectInfobox).where(inArray(subjectInfobox.subject_id, subjectIds)),
    db.select().from(subjectEpisodes).where(inArray(subjectEpisodes.subject_id, subjectIds)),
    db
      .select({
        subject_id: subjectCharacters.subject_id,
        character_id: subjectCharacters.character_id,
        relation: subjectCharacters.relation,
        char_name: charactersTable.name,
        char_name_cn: charactersTable.name_cn,
        char_type: charactersTable.type,
        char_summary: charactersTable.summary,
        char_image_large: charactersTable.image_large,
        char_image_medium: charactersTable.image_medium,
        char_image_small: charactersTable.image_small,
        char_image_grid: charactersTable.image_grid,
      })
      .from(subjectCharacters)
      .innerJoin(charactersTable, eq(subjectCharacters.character_id, charactersTable.id))
      .where(inArray(subjectCharacters.subject_id, subjectIds)),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const charActorMap = new Map<number, any[]>();

  if (chars.length > 0) {
    const charIds = chars.map((c) => c.character_id);
    const cpRows = await db
      .select({
        character_id: characterPersons.character_id,
        person_id: personsTable.id,
        person_name: personsTable.name,
        person_type: personsTable.type,
        person_short_summary: personsTable.short_summary,
        person_locked: personsTable.locked,
        person_image_large: personsTable.image_large,
        person_image_medium: personsTable.image_medium,
        person_image_small: personsTable.image_small,
        person_image_grid: personsTable.image_grid,
      })
      .from(characterPersons)
      .innerJoin(personsTable, eq(characterPersons.person_id, personsTable.id))
      .where(inArray(characterPersons.character_id, charIds));

    const personIds = [...new Set(cpRows.map((r) => r.person_id))];
    const careerRows = personIds.length > 0
      ? await db.select().from(personCareers).where(inArray(personCareers.person_id, personIds))
      : [];

    const careerMap = new Map<number, string[]>();
    for (const c of careerRows) {
      if (!careerMap.has(c.person_id)) careerMap.set(c.person_id, []);
      careerMap.get(c.person_id)!.push(c.career);
    }

    for (const cp of cpRows) {
      if (!charActorMap.has(cp.character_id)) charActorMap.set(cp.character_id, []);
      charActorMap.get(cp.character_id)!.push({
        person_id: cp.person_id,
        person_name: cp.person_name,
        person_type: cp.person_type,
        person_short_summary: cp.person_short_summary,
        person_locked: cp.person_locked,
        person_image_large: cp.person_image_large,
        person_image_medium: cp.person_image_medium,
        person_image_small: cp.person_image_small,
        person_image_grid: cp.person_image_grid,
        career: null,
        _careers: careerMap.get(cp.person_id) ?? [],
      });
    }

    for (const entry of charActorMap.values()) {
      for (const actor of entry) {
        actor.careers = actor._careers;
        delete actor._careers;
      }
    }
  }

  const subjectBgmidMap = new Map<number, number>();
  for (const [bgmid, sid] of subjectIdMap) {
    subjectBgmidMap.set(sid, bgmid);
  }

  for (const row of subjectRows) {
    const bgmid = row.bgmid;
    const structured = result.get(bgmid)!;
    const sid = row.id;

    structured.tags = tags.filter((t) => t.subject_id === sid).map((t) => ({
      name: t.name,
      count: t.count,
    }));

    structured.meta_tags = metaTags.filter((t) => t.subject_id === sid).map((t) => t.tag);

    if (structured.rating) {
      structured.rating.counts = ratingCounts
        .filter((r) => r.subject_id === sid)
        .map((r) => ({ star: r.star, count: r.count }));
    }

    structured.infobox = infobox
      .filter((i) => i.subject_id === sid)
      .map((i) => ({
        key: i.key,
        sub_key: i.sub_key,
        value: i.value,
        sort_order: i.sort_order,
      }));

    structured.episodes = episodes
      .filter((e) => e.subject_id === sid)
      .map((e) => ({
        id: e.id,
        bgm_ep_id: e.bgm_ep_id,
        type: e.type,
        sort: Number(e.sort),
        ep: e.ep,
        name: e.name,
        name_cn: e.name_cn,
        airdate: e.airdate,
        duration: e.duration,
        desc: e.desc,
        status: e.status,
      })) as StructuredEpisode[];

    structured.characters = chars
      .filter((c) => c.subject_id === sid)
      .map((c) => {
        const charResult: StructuredCharacter = {
          id: c.character_id,
          name: c.char_name,
          name_cn: c.char_name_cn,
          type: c.char_type,
          summary: c.char_summary,
          relation: c.relation || "",
          actors: (charActorMap.get(c.character_id) ?? []).map((a: any) => ({
            id: a.person_id,
            name: a.person_name,
            type: a.person_type,
            short_summary: a.person_short_summary,
            locked: a.person_locked === 1,
            images: a.person_image_large
              ? {
                  large: a.person_image_large,
                  medium: a.person_image_medium || "",
                  small: a.person_image_small || "",
                  grid: a.person_image_grid || "",
                }
              : undefined,
            careers: a.careers ?? [],
          })),
        };
        if (c.char_image_large) {
          charResult.images = {
            large: c.char_image_large,
            medium: c.char_image_medium || "",
            small: c.char_image_small || "",
            grid: c.char_image_grid || "",
          };
        }
        return charResult;
      });
  }

  return result;
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

function convertStructuredInfoboxToLegacy(items: StructuredInfoboxItem[]): BangumiInfoboxItem[] {
  const map = new Map<string, Array<{ k?: string; v: string }>>();
  for (const item of items) {
    const existing = map.get(item.key) || [];
    if (item.sub_key) {
      existing.push({ k: item.sub_key, v: item.value });
    } else {
      existing.push({ v: item.value });
    }
    map.set(item.key, existing);
  }
  return Array.from(map.entries()).map(([key, values]) => {
    if (values.length === 1 && !values[0].k) {
      return { key, value: values[0].v } as BangumiInfoboxItem;
    }
    return {
      key,
      value: values.map((v) => (v.k ? { k: v.k, v: v.v } : { v: v.v })),
    } as BangumiInfoboxItem;
  });
}
