import _ from "lodash";
import type {
  BangumiSubject,
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
import { db } from "../../../common/database/connection.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";
import { subjectAliases } from "../../../common/database/schema/bangumi-subject-aliases.js";
import { subjectTags } from "../../../common/database/schema/bangumi-subject-tags.js";
import { subjectMetaTags } from "../../../common/database/schema/bangumi-subject-meta-tags.js";
import { subjectRatingCounts } from "../../../common/database/schema/bangumi-subject-rating-counts.js";
import { subjectInfobox } from "../../../common/database/schema/bangumi-subject-infobox.js";
import { subjectEpisodes } from "../../../common/database/schema/bangumi-episodes.js";
import { subjectRelations } from "../../../common/database/schema/bangumi-subject-relations.js";
import { subjectCharacters } from "../../../common/database/schema/bangumi-subject-characters.js";
import { characters as charactersTable } from "../../../common/database/schema/bangumi-characters.js";
import { subjectCharacterPersons } from "../../../common/database/schema/bangumi-subject-character-actors.js";
import { persons as personsTable } from "../../../common/database/schema/bangumi-persons.js";
import { personCareers } from "../../../common/database/schema/bangumi-person-careers.js";
import { inArray, eq, and } from "drizzle-orm";
import { ensureStructuredData } from "../bangumi/cache.js";
import { rewriteBgmImageUrl, appendPosterSuffix } from "../../../common/tools/bangumi-image.js";
import { normalizeStructuredEpisodes } from "../../../common/tools/episode-normalize.js";
import { anime } from "../../../common/database/schema/anime.js";

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
  structured?: AnimeDetail["structured"];
  [key: string]: unknown;
}

export type { ParsedAnime };

interface CharActorEntry {
  person_id: number;
  person_name: string;
  person_type: number | null;
  person_short_summary: string | null;
  person_locked: number | null;
  person_image_large: string | null;
  person_image_medium: string | null;
  person_image_small: string | null;
  person_image_grid: string | null;
  careers: string[];
}

export async function parseAnime(
  rawData: RawAnimeRow | RawAnimeRow[],
  full = false
): Promise<ParsedAnime[]> {
  if (!rawData) throw new Error("No data provide");
  if (typeof rawData !== "object") throw new Error("Data is not a Object");

  let dataArray = Array.isArray(rawData) ? rawData : [rawData];
  dataArray = _.compact(dataArray);
  const bgmIDList = parseAllBgmID(dataArray);
  const structuredData = await getStructuredData(bgmIDList, full);
  const relationsData = full ? await getRelationsData(bgmIDList) : new Map<number, AnimeRelation[]>();
  const parseResults: ParsedAnime[] = [];

  for (const i in dataArray) {
    parseResults.push(
      await parseSingleAnimeData(dataArray[i], structuredData, relationsData, full)
    );
  }

  return parseResults;
}

async function parseSingleAnimeData(
  rawData: RawAnimeRow,
  structuredData: Map<number, ReturnType<typeof buildEmptyStructured>>,
  relationsData: Map<number, AnimeRelation[]>,
  full = false
): Promise<ParsedAnime> {
  const bgmID = parseInt(String(rawData.bgmid));
  if (bgmID) {
    const structured = structuredData.get(bgmID);

    if (!structured || (structured.name === null && structured.name_cn === null)) {
      await ensureStructuredData(bgmID);
      return parseSingleAnimeWithoutBgm(rawData);
    }

    const poster = structured.images?.large
      ? appendPosterSuffix(structured.images.large) ?? undefined
      : rawData.poster || undefined;

    const images = {
      large: structured.images?.large || undefined,
      common: structured.images?.common || undefined,
      medium: structured.images?.medium || undefined,
      small: structured.images?.small || undefined,
      grid: structured.images?.grid || undefined,
      poster,
    };

    const thisAnimeData: ParsedAnime = {
      id: parseInt(String(rawData.id)),
      bgmID,
      index: { year: rawData.year, type: rawData.type, name: rawData.name },
      views: rawData.views,
      title: (rawData.title || "").replace(/\[BDRip\]|\[NSFW\]/gi, ""),
      type: {
        bdrip: /\[BDRip\]/i.test(rawData.title || ""),
        nsfw: /\[NSFW\]/i.test(rawData.title || ""),
      },
      images,
      deleted: false,
      episode_start: rawData.episode_start as number | null | undefined,
    };

    if (full && structured) {
      const result: ParsedAnime = {
        ...thisAnimeData,
        relations: relationsData.get(bgmID) ?? [],
      };

      result.structured = {
        rating: structured.rating ?? { score: undefined, rank: undefined, total: undefined, counts: [] },
        tags: structured.tags,
        meta_tags: structured.meta_tags,
        ep_count: structured.ep_count,
        infobox: structured.infobox,
        episodes: normalizeStructuredEpisodes(
          structured.episodes,
          rawData.episode_start as number | null | undefined
        ),
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

      return result;
    }

    return thisAnimeData;
  }

  return parseSingleAnimeWithoutBgm(rawData);
}

function parseSingleAnimeWithoutBgm(rawData: RawAnimeRow): ParsedAnime {
  return {
    id: parseInt(String(rawData.id)),
    bgmID: parseInt(String(rawData.bgmid)) || undefined,
    index: { year: rawData.year, type: rawData.type, name: rawData.name },
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
    episode_start: rawData.episode_start as number | null | undefined,
  };
}

function parseAllBgmID(data: RawAnimeRow[]): number[] {
  const bgmIDList: number[] = [];
  for (const i in data) {
    const thisBgmId = parseInt(String(data[i].bgmid));
    if (thisBgmId) bgmIDList.push(thisBgmId);
  }
  return bgmIDList;
}

// --- Relations from structured table ---

async function getRelationsData(
  bgmIDList: number[]
): Promise<Map<number, AnimeRelation[]>> {
  const result = new Map<number, AnimeRelation[]>();
  if (bgmIDList.length === 0) return result;

  for (const bgmID of bgmIDList) {
    result.set(bgmID, []);
  }

  const subRows = await db
    .select({ id: subjects.id, bgmid: subjects.bgmid })
    .from(subjects)
    .where(inArray(subjects.bgmid, bgmIDList));

  if (subRows.length === 0) return result;

  const subjectIds = subRows.map((r) => r.id);
  const bgmidToSubjectId = new Map(subRows.map((r) => [r.bgmid, r.id]));

  const relRows = await db
    .select()
    .from(subjectRelations)
    .where(inArray(subjectRelations.subject_id, subjectIds));

  if (relRows.length === 0) return result;

  // Group relations by source bgmid
  const subjectIdToBgmID = new Map(subRows.map((r) => [r.id, r.bgmid]));
  const relByBgmID = new Map<number, Array<{ related_bgmid: number; relation_type: string | null }>>();
  for (const row of relRows) {
    const sourceBgmID = subjectIdToBgmID.get(row.subject_id);
    if (sourceBgmID == null) continue;
    const existing = relByBgmID.get(sourceBgmID) || [];
    existing.push({ related_bgmid: row.related_bgmid, relation_type: row.relation_type });
    relByBgmID.set(sourceBgmID, existing);
  }

  // 批量查询所有关联 bgmid 对应的 anime 行，避免在循环中逐个调用 getAnimesByBgmID 造成 N+1
  const allRelatedBgmIDs = [...new Set(
    [...relByBgmID.values()].flat().map((r) => r.related_bgmid)
  )];

  if (allRelatedBgmIDs.length === 0) return result;

  const animeRows = await db
    .select()
    .from(anime)
    .where(and(eq(anime.deleted, 0), inArray(anime.bgmid, allRelatedBgmIDs.map(String))));

  const parsedAnimes = await parseAnime(animeRows);

  // 按关联 bgmid 分组解析后的 anime
  const animeByBgmID = new Map<number, AnimeBase[]>();
  for (const a of parsedAnimes) {
    if (a.bgmID == null) continue;
    const existing = animeByBgmID.get(a.bgmID) || [];
    existing.push(a as unknown as AnimeBase);
    animeByBgmID.set(a.bgmID, existing);
  }

  for (const [sourceBgmID, rels] of relByBgmID) {
    const relations: AnimeRelation[] = [];
    for (const rel of rels) {
      const animes = animeByBgmID.get(rel.related_bgmid) ?? [];
      for (const animeEntry of animes) {
        relations.push({
          ...animeEntry,
          relation: rel.relation_type || "",
        });
      }
    }
    result.set(sourceBgmID, relations);
  }

  return result;
}

// --- Structured data from subjects + child tables ---

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
    images: null as {
      large: string | null;
      common: string | null;
      medium: string | null;
      small: string | null;
      grid: string | null;
    } | null,
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

  const subjectIdMap = new Map<number, number>();
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
    structured.date = row.date;
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
      large: rewriteBgmImageUrl(row.image_large),
      common: rewriteBgmImageUrl(row.image_common),
      medium: rewriteBgmImageUrl(row.image_medium),
      small: rewriteBgmImageUrl(row.image_small),
      grid: rewriteBgmImageUrl(row.image_grid),
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

  const charActorMap = new Map<string, CharActorEntry[]>();

  if (chars.length > 0) {
    const cpRows = await db
      .select({
        subject_id: subjectCharacterPersons.subject_id,
        character_id: subjectCharacterPersons.character_id,
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
      .from(subjectCharacterPersons)
      .innerJoin(personsTable, eq(subjectCharacterPersons.person_id, personsTable.id))
      .where(inArray(subjectCharacterPersons.subject_id, subjectIds));

    const personIds = [...new Set(cpRows.map((r) => r.person_id))];
    const careerRows =
      personIds.length > 0
        ? await db.select().from(personCareers).where(inArray(personCareers.person_id, personIds))
        : [];

    const careerMap = new Map<number, string[]>();
    for (const c of careerRows) {
      if (!careerMap.has(c.person_id)) careerMap.set(c.person_id, []);
      careerMap.get(c.person_id)!.push(c.career);
    }

    for (const cp of cpRows) {
      const key = `${cp.subject_id}:${cp.character_id}`;
      if (!charActorMap.has(key)) charActorMap.set(key, []);
      charActorMap.get(key)!.push({
        person_id: cp.person_id,
        person_name: cp.person_name,
        person_type: cp.person_type,
        person_short_summary: cp.person_short_summary,
        person_locked: cp.person_locked,
        person_image_large: cp.person_image_large,
        person_image_medium: cp.person_image_medium,
        person_image_small: cp.person_image_small,
        person_image_grid: cp.person_image_grid,
        careers: careerMap.get(cp.person_id) ?? [],
      });
    }
  }

  for (const row of subjectRows) {
    const bgmid = row.bgmid;
    const structured = result.get(bgmid)!;
    const sid = row.id;

    structured.tags = tags
      .filter((t) => t.subject_id === sid)
      .map((t) => ({ name: t.name, count: t.count }));

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
          actors: (charActorMap.get(`${c.subject_id}:${c.character_id}`) ?? []).map((a) => ({
            id: a.person_id,
            name: a.person_name,
            type: a.person_type,
            short_summary: a.person_short_summary,
            locked: a.person_locked === 1,
            images: a.person_image_large
              ? {
                  large: rewriteBgmImageUrl(a.person_image_large) || "",
                  medium: rewriteBgmImageUrl(a.person_image_medium) || "",
                  small: rewriteBgmImageUrl(a.person_image_small) || "",
                  grid: rewriteBgmImageUrl(a.person_image_grid) || "",
                }
              : undefined,
            careers: a.careers ?? [],
          })),
        };
        if (c.char_image_large) {
          charResult.images = {
            large: rewriteBgmImageUrl(c.char_image_large) || "",
            medium: rewriteBgmImageUrl(c.char_image_medium) || "",
            small: rewriteBgmImageUrl(c.char_image_small) || "",
            grid: rewriteBgmImageUrl(c.char_image_grid) || "",
          };
        }
        return charResult;
      });
  }

  return result;
}

function convertStructuredInfoboxToLegacy(
  items: StructuredInfoboxItem[]
): BangumiInfoboxItem[] {
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
