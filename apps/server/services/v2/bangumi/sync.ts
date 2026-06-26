import { db } from "../../../common/database/connection.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";
import { subjectAliases } from "../../../common/database/schema/bangumi-subject-aliases.js";
import { subjectTags } from "../../../common/database/schema/bangumi-subject-tags.js";
import { subjectMetaTags } from "../../../common/database/schema/bangumi-subject-meta-tags.js";
import { subjectRatingCounts } from "../../../common/database/schema/bangumi-subject-rating-counts.js";
import { subjectInfobox } from "../../../common/database/schema/bangumi-subject-infobox.js";
import { subjectEpisodes } from "../../../common/database/schema/bangumi-episodes.js";
import { subjectRelations } from "../../../common/database/schema/bangumi-subject-relations.js";
import { characters as charactersTable } from "../../../common/database/schema/bangumi-characters.js";
import { persons as personsTable } from "../../../common/database/schema/bangumi-persons.js";
import { personCareers } from "../../../common/database/schema/bangumi-person-careers.js";
import { subjectCharacters } from "../../../common/database/schema/bangumi-subject-characters.js";
import { characterPersons } from "../../../common/database/schema/bangumi-character-persons.js";
import { subjectCharacterPersons } from "../../../common/database/schema/bangumi-subject-character-actors.js";
import { eq } from "drizzle-orm";
import type {
  BangumiSubject,
  BangumiSubjectRelation,
  BangumiRelatedCharacter,
} from "@lavaanime/shared";
import { getBangumiEpisodes } from "./api.js";
import { log } from "../../../common/tools/logger.js";

function extractAliases(subject: BangumiSubject): string[] {
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
            if ("v" in entry) aliases.push(entry.v);
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

export async function syncSubject(bgmSubject: BangumiSubject): Promise<number> {
  const bgmID = bgmSubject.id;

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
    date: bgmSubject.date ?? null,
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
    image_large: bgmSubject.images?.large ?? null,
    image_common: bgmSubject.images?.common ?? null,
    image_medium: bgmSubject.images?.medium ?? null,
    image_small: bgmSubject.images?.small ?? null,
    image_grid: bgmSubject.images?.grid ?? null,
  };

  if (existingSubject) {
    subjectId = existingSubject.id;
    await db.update(subjects).set(subjectValues).where(eq(subjects.id, subjectId));
  } else {
    const [inserted] = await db.insert(subjects).values(subjectValues).$returningId();
    subjectId = Number(inserted?.id) || 0;
  }

  // Aliases
  await db.delete(subjectAliases).where(eq(subjectAliases.subject_id, subjectId));
  const aliases = extractAliases(bgmSubject);
  if (aliases.length > 0) {
    await db.insert(subjectAliases).values(
      aliases.map((alias) => ({ subject_id: subjectId, alias }))
    );
  }

  // Tags
  await db.delete(subjectTags).where(eq(subjectTags.subject_id, subjectId));
  if (bgmSubject.tags && bgmSubject.tags.length > 0) {
    await db.insert(subjectTags).values(
      bgmSubject.tags.map((tag) => ({ subject_id: subjectId, name: tag.name, count: tag.count }))
    );
  }

  // Meta tags
  await db.delete(subjectMetaTags).where(eq(subjectMetaTags.subject_id, subjectId));
  if (bgmSubject.meta_tags && bgmSubject.meta_tags.length > 0) {
    await db.insert(subjectMetaTags).values(
      bgmSubject.meta_tags.map((tag) => ({ subject_id: subjectId, tag }))
    );
  }

  // Rating counts
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

  // Infobox
  await db.delete(subjectInfobox).where(eq(subjectInfobox.subject_id, subjectId));
  const infoboxRows = parseInfoboxRows(bgmSubject);
  if (infoboxRows.length > 0) {
    await db.insert(subjectInfobox).values(
      infoboxRows.map((row) => ({ subject_id: subjectId, ...row }))
    );
  }

  log.info("Synced subject bgm%d to structured tables", bgmID);
  return subjectId;
}

export async function syncRelations(
  bgmID: number,
  relations: BangumiSubjectRelation[]
): Promise<void> {
  const [subjectRow] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);

  if (!subjectRow) return;
  const subjectId = subjectRow.id;

  await db.delete(subjectRelations).where(eq(subjectRelations.subject_id, subjectId));

  if (relations.length > 0) {
    await db.insert(subjectRelations).values(
      relations.map((r, index) => ({
        subject_id: subjectId,
        related_bgmid: r.id,
        related_type: r.type ?? null,
        related_name: r.name ?? null,
        related_name_cn: r.name_cn ?? null,
        relation_type: r.relation,
        image_large: r.images?.large ?? null,
        image_common: r.images?.common ?? null,
        image_medium: r.images?.medium ?? null,
        image_small: r.images?.small ?? null,
        image_grid: r.images?.grid ?? null,
        sort_order: index,
      }))
    );
  }

  log.info("Synced %d relations for bgm%d", relations.length, bgmID);
}

export async function syncCharacters(
  bgmID: number,
  chars: BangumiRelatedCharacter[]
): Promise<void> {
  const [subjectRow] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.bgmid, bgmID))
    .limit(1);

  if (!subjectRow) return;
  const subjectId = subjectRow.id;

  await db.delete(subjectCharacters).where(eq(subjectCharacters.subject_id, subjectId));
  await db.delete(subjectCharacterPersons).where(eq(subjectCharacterPersons.subject_id, subjectId));

  if (!chars.length) {
    log.info("Synced 0 characters for bgm%d", bgmID);
    return;
  }

  for (const [charIndex, char] of chars.entries()) {
    await db
      .insert(charactersTable)
      .values({
        id: char.id,
        name: char.name,
        name_cn: char.name_cn ?? null,
        type: char.type,
        summary: char.summary ?? null,
        image_large: char.images?.large ?? null,
        image_medium: char.images?.medium ?? null,
        image_small: char.images?.small ?? null,
        image_grid: char.images?.grid ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: char.name,
          name_cn: char.name_cn ?? null,
          type: char.type,
          summary: char.summary ?? null,
        },
      });

    await db
      .insert(subjectCharacters)
      .values({ subject_id: subjectId, character_id: char.id, relation: char.relation, sort_order: charIndex })
      .onDuplicateKeyUpdate({ set: { relation: char.relation, sort_order: charIndex } });

    if (char.actors) {
      for (const [actorIndex, actor] of char.actors.entries()) {
        await db
          .insert(personsTable)
          .values({
            id: actor.id,
            name: actor.name,
            type: actor.type,
            short_summary: actor.short_summary,
            locked: actor.locked ? 1 : 0,
            image_large: actor.images?.large ?? null,
            image_medium: actor.images?.medium ?? null,
            image_small: actor.images?.small ?? null,
            image_grid: actor.images?.grid ?? null,
          })
          .onDuplicateKeyUpdate({
            set: { name: actor.name, type: actor.type, short_summary: actor.short_summary },
          });

        if (actor.career && actor.career.length > 0) {
          await db.delete(personCareers).where(eq(personCareers.person_id, actor.id));
          await db.insert(personCareers).values(
            actor.career.map((c) => ({ person_id: actor.id, career: c }))
          );
        }

        await db
          .insert(characterPersons)
          .values({ character_id: char.id, person_id: actor.id })
          .onDuplicateKeyUpdate({ set: { character_id: char.id } });

        await db
          .insert(subjectCharacterPersons)
          .values({ subject_id: subjectId, character_id: char.id, person_id: actor.id, sort_order: actorIndex })
          .onDuplicateKeyUpdate({ set: { sort_order: actorIndex } });
      }
    }
  }

  log.info("Synced %d characters for bgm%d", chars.length, bgmID);
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

  await db.delete(subjectEpisodes).where(eq(subjectEpisodes.subject_id, subjectId));

  for (const ep of episodes) {
    await db
      .insert(subjectEpisodes)
      .values({
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
      })
      .onDuplicateKeyUpdate({
        set: {
          type: ep.type ?? 0,
          sort: String(ep.sort),
          ep: ep.ep ?? null,
          name: ep.name ?? null,
          name_cn: ep.name_cn ?? null,
          airdate: ep.airdate ?? null,
          duration: ep.duration ?? null,
          desc: ep.desc ?? null,
          status: ep.status ?? null,
        },
      });
  }

  log.info("Synced %d episodes for bgm%d", episodes.length, bgmID);
}

export async function syncAll(
  bgmID: number,
  bgmSubject: BangumiSubject,
  relations: BangumiSubjectRelation[],
  chars: BangumiRelatedCharacter[]
): Promise<void> {
  await syncSubject(bgmSubject);
  await syncRelations(bgmID, relations);
  await syncCharacters(bgmID, chars);
  await syncEpisodes(bgmID);
  log.info("Full sync completed for bgm%d", bgmID);
}
