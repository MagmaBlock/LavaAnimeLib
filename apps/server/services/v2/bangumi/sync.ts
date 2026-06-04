import { db } from "../../../common/database/connection.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { subjects } from "../../../common/database/schema/subjects.js";
import { subjectAliases } from "../../../common/database/schema/subject-aliases.js";
import { subjectTags } from "../../../common/database/schema/subject-tags.js";
import { subjectMetaTags } from "../../../common/database/schema/subject-meta-tags.js";
import { subjectRatingCounts } from "../../../common/database/schema/subject-rating-counts.js";
import { subjectInfobox } from "../../../common/database/schema/subject-infobox.js";
import { subjectEpisodes } from "../../../common/database/schema/subject-episodes.js";
import { characters as charactersTable } from "../../../common/database/schema/characters.js";
import { persons as personsTable } from "../../../common/database/schema/persons.js";
import { personCareers } from "../../../common/database/schema/person-careers.js";
import { subjectCharacters } from "../../../common/database/schema/subject-characters.js";
import { characterPersons } from "../../../common/database/schema/character-persons.js";
import { anime } from "../../../common/database/schema/anime.js";
import { eq, and } from "drizzle-orm";
import type {
  BangumiSubject,
  BangumiRelatedCharacter,
  BangumiInfoboxItem,
  BangumiInfoboxValue,
} from "@lavaanime/shared";
import { getBangumiEpisodes } from "./api.js";
import config from "../../../common/env.js";
import { log } from "../../../common/tools/logger.js";

function replaceImageHost(url: string): string {
  return url.replace(/https:\/\/lain\.bgm\.tv/gi, config.bangumiImage.host);
}

function extractAliases(
  subject: BangumiSubject
): string[] {
  const aliases: string[] = [];

  if (subject.name) aliases.push(subject.name);
  if (subject.name_cn) aliases.push(subject.name_cn);

  if (subject.infobox) {
    for (const item of subject.infobox) {
      if (
        item.key.includes("别名") ||
        item.key.includes("译名") ||
        item.key === "英文名" ||
        item.key === "日文名" ||
        item.key === "罗马字"
      ) {
        if (typeof item.value === "string") {
          aliases.push(item.value);
        } else if (Array.isArray(item.value)) {
          for (const entry of item.value) {
            if ("v" in entry) {
              aliases.push(entry.v);
            }
          }
        }
      }
    }
  }

  return [...new Set(aliases)];
}

function parseInfoboxRows(
  bgmSubject: BangumiSubject
): Array<{ key: string; sub_key: string | null; value: string; sort_order: number }> {
  const rows: Array<{ key: string; sub_key: string | null; value: string; sort_order: number }> = [];

  if (!bgmSubject.infobox) return rows;

  for (const item of bgmSubject.infobox) {
    const value = item.value;
    if (typeof value === "string") {
      rows.push({ key: item.key, sub_key: null, value, sort_order: 0 });
    } else if (Array.isArray(value)) {
      let sortOrder = 0;
      for (const entry of value) {
        if ("k" in entry && "v" in entry) {
          rows.push({ key: item.key, sub_key: entry.k, value: entry.v, sort_order: sortOrder++ });
        } else if ("v" in entry) {
          rows.push({ key: item.key, sub_key: null, value: entry.v, sort_order: sortOrder++ });
        }
      }
    }
  }

  return rows;
}

export async function syncSubject(bgmID: number): Promise<void> {
  const [raw] = await db
    .select({ subjects: bangumiData.subjects })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (!raw?.subjects) return;

  const bgmSubject: BangumiSubject = JSON.parse(raw.subjects);

  const [existingSubject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);

  let subjectId: number;

  const subjectValues = {
    bgmid: bgmSubject.id,
    type: bgmSubject.type,
    name: bgmSubject.name,
    name_cn: bgmSubject.name_cn,
    summary: bgmSubject.summary,
    nsfw: bgmSubject.nsfw ? 1 : 0,
    locked: bgmSubject.locked ? 1 : 0,
    platform: bgmSubject.platform,
    air_date: bgmSubject.date ?? null,
    series: bgmSubject.series ? 1 : 0,
    volumes: bgmSubject.volumes,
    eps: bgmSubject.eps,
    total_episodes: bgmSubject.total_episodes,
    rating_score: bgmSubject.rating?.score != null ? String(bgmSubject.rating.score) : null,
    rating_rank: bgmSubject.rating?.rank ?? null,
    rating_total: bgmSubject.rating?.total ?? null,
    collect_wish: bgmSubject.collection?.wish ?? 0,
    collect_collect: bgmSubject.collection?.collect ?? 0,
    collect_doing: bgmSubject.collection?.doing ?? 0,
    collect_on_hold: bgmSubject.collection?.on_hold ?? 0,
    collect_dropped: bgmSubject.collection?.dropped ?? 0,
    image_large: bgmSubject.images?.large ? replaceImageHost(bgmSubject.images.large) : null,
    image_common: bgmSubject.images?.common ? replaceImageHost(bgmSubject.images.common) : null,
    image_medium: bgmSubject.images?.medium ? replaceImageHost(bgmSubject.images.medium) : null,
    image_small: bgmSubject.images?.small ? replaceImageHost(bgmSubject.images.small) : null,
    image_grid: bgmSubject.images?.grid ? replaceImageHost(bgmSubject.images.grid) : null,
  };

  if (existingSubject) {
    subjectId = existingSubject.id;
    await db
      .update(subjects)
      .set(subjectValues)
      .where(eq(subjects.id, subjectId));
  } else {
    const [inserted] = await db
      .insert(subjects)
      .values(subjectValues)
      .$returningId();
    subjectId = Number(inserted?.id) || 0;
  }

  await db.delete(subjectAliases).where(eq(subjectAliases.subject_id, subjectId));
  const aliases = extractAliases(bgmSubject);
  if (aliases.length > 0) {
    await db.insert(subjectAliases).values(
      aliases.map((alias) => ({ subject_id: subjectId, alias }))
    );
  }

  if (bgmSubject.tags && bgmSubject.tags.length > 0) {
    for (const tag of bgmSubject.tags) {
      await db
        .insert(subjectTags)
        .values({ subject_id: subjectId, name: tag.name, count: tag.count })
        .onDuplicateKeyUpdate({ set: { count: tag.count } });
    }
  }

  await db.delete(subjectMetaTags).where(eq(subjectMetaTags.subject_id, subjectId));
  if (bgmSubject.meta_tags && bgmSubject.meta_tags.length > 0) {
    await db.insert(subjectMetaTags).values(
      bgmSubject.meta_tags.map((tag) => ({ subject_id: subjectId, tag }))
    );
  }

  await db.delete(subjectRatingCounts).where(eq(subjectRatingCounts.subject_id, subjectId));
  if (bgmSubject.rating?.count) {
    const counts = bgmSubject.rating.count;
    const entries: Array<{ subject_id: number; star: number; count: number }> = [];
    for (let star = 1; star <= 10; star++) {
      const c = (counts as Record<string, number>)[String(star)] ?? 0;
      entries.push({ subject_id: subjectId, star, count: c });
    }
    await db.insert(subjectRatingCounts).values(entries);
  }

  await db.delete(subjectInfobox).where(eq(subjectInfobox.subject_id, subjectId));
  const infoboxRows = parseInfoboxRows(bgmSubject);
  if (infoboxRows.length > 0) {
    await db.insert(subjectInfobox).values(
      infoboxRows.map((row) => ({ subject_id: subjectId, ...row }))
    );
  }

  if (bgmSubject.images?.large) {
    const poster = `${replaceImageHost(bgmSubject.images.large)}/poster`;
    await db
      .update(anime)
      .set({ poster })
      .where(eq(anime.bgmid, String(bgmID)));
  }

  log.info("Synced subject bgm%d to structured tables", bgmID);
}

export async function syncCharacters(bgmID: number): Promise<void> {
  const [raw] = await db
    .select({ characters: bangumiData.characters })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (!raw?.characters) return;

  const chars: BangumiRelatedCharacter[] = JSON.parse(raw.characters);
  if (!chars.length) return;

  const [subjectRow] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);

  if (!subjectRow) return;
  const subjectId = subjectRow.id;

  const processedPersonIds = new Set<number>();
  const processedCharIds = new Set<number>();

  for (const char of chars) {
    await db
      .insert(charactersTable)
      .values({
        id: char.id,
        name: char.name,
        name_cn: char.name_cn ?? null,
        type: char.type,
        summary: char.summary ?? null,
        image_large: char.images?.large ? replaceImageHost(char.images.large) : null,
        image_medium: char.images?.medium ? replaceImageHost(char.images.medium) : null,
        image_small: char.images?.small ? replaceImageHost(char.images.small) : null,
        image_grid: char.images?.grid ? replaceImageHost(char.images.grid) : null,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: char.name,
          name_cn: char.name_cn ?? null,
          type: char.type,
          summary: char.summary ?? null,
        },
      });

    processedCharIds.add(char.id);

    await db
      .insert(subjectCharacters)
      .values({
        subject_id: subjectId,
        character_id: char.id,
        relation: char.relation,
      })
      .onDuplicateKeyUpdate({
        set: { relation: char.relation },
      });

    if (char.actors) {
      for (const actor of char.actors) {
        await db
          .insert(personsTable)
          .values({
            id: actor.id,
            name: actor.name,
            type: actor.type,
            short_summary: actor.short_summary,
            locked: actor.locked ? 1 : 0,
            image_large: actor.images?.large ? replaceImageHost(actor.images.large) : null,
            image_medium: actor.images?.medium ? replaceImageHost(actor.images.medium) : null,
            image_small: actor.images?.small ? replaceImageHost(actor.images.small) : null,
            image_grid: actor.images?.grid ? replaceImageHost(actor.images.grid) : null,
          })
          .onDuplicateKeyUpdate({
            set: {
              name: actor.name,
              type: actor.type,
              short_summary: actor.short_summary,
            },
          });

        processedPersonIds.add(actor.id);

        if (actor.career && actor.career.length > 0) {
          await db.delete(personCareers).where(eq(personCareers.person_id, actor.id));
          await db.insert(personCareers).values(
            actor.career.map((c) => ({ person_id: actor.id, career: c }))
          );
        }

        await db
          .insert(characterPersons)
          .values({
            character_id: char.id,
            person_id: actor.id,
          })
          .onDuplicateKeyUpdate({ set: { character_id: char.id } });
      }
    }
  }
}

export async function syncEpisodes(bgmID: number): Promise<void> {
  const [subjectRow] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);

  if (!subjectRow) return;
  const subjectId = subjectRow.id;

  const episodes = await getBangumiEpisodes(bgmID);

  const toInsert = episodes.map((ep) => ({
    subject_id: subjectId,
    bgm_ep_id: ep.id,
    type: ep.type ?? 0,
    sort: String(ep.sort),
    ep: ep.ep ?? null,
    name: ep.name || null,
    name_cn: ep.name_cn || null,
    airdate: ep.airdate ?? null,
    duration: ep.duration ?? null,
    desc: ep.desc ?? null,
    status: ep.status ?? null,
  }));

  if (toInsert.length > 0) {
    for (const row of toInsert) {
      await db
        .insert(subjectEpisodes)
        .values(row)
        .onDuplicateKeyUpdate({
          set: {
            type: row.type,
            sort: String(row.sort),
            ep: row.ep,
            name: row.name,
            name_cn: row.name_cn,
            airdate: row.airdate,
            duration: row.duration,
            desc: row.desc,
            status: row.status,
          },
        });
    }
  }
}

export async function syncAll(bgmID: number): Promise<void> {
  try {
    await syncSubject(bgmID);
    await syncCharacters(bgmID);
    await syncEpisodes(bgmID);
    log.info("Full sync completed for bgm%d", bgmID);
  } catch (error) {
    log.error(error as Error, "Full sync failed for bgm%d", bgmID);
  }
}
