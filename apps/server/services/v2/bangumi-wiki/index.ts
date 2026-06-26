import { db } from "../../../common/database/connection.js";
import { characters } from "../../../common/database/schema/bangumi-characters.js";
import { subjectCharacterPersons } from "../../../common/database/schema/bangumi-subject-character-actors.js";
import { persons } from "../../../common/database/schema/bangumi-persons.js";
import { personCareers } from "../../../common/database/schema/bangumi-person-careers.js";
import { subjectCharacters } from "../../../common/database/schema/bangumi-subject-characters.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";
import { anime } from "../../../common/database/schema/anime.js";
import { eq, inArray, and } from "drizzle-orm";
import { rewriteBgmImageUrl } from "../../../common/tools/bangumi-image.js";
import type {
  BangumiWikiCharacterResult,
  BangumiWikiPersonResult,
  StructuredImages,
} from "@lavaanime/shared";

function rewriteImages(
  large: string | null | undefined,
  medium: string | null | undefined,
  small: string | null | undefined,
  grid: string | null | undefined
): StructuredImages | null {
  if (!large) return null;
  return {
    large: rewriteBgmImageUrl(large),
    medium: rewriteBgmImageUrl(medium),
    small: rewriteBgmImageUrl(small),
    grid: rewriteBgmImageUrl(grid),
  };
}

export async function getCharacterDetail(id: number): Promise<BangumiWikiCharacterResult | null> {
  const [char] = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  if (!char) return null;

  // Get subjects this character appears in
  const scRows = await db
    .select({
      subject_id: subjectCharacters.subject_id,
      relation: subjectCharacters.relation,
    })
    .from(subjectCharacters)
    .where(eq(subjectCharacters.character_id, id));

  const subjectIds = scRows.map(r => r.subject_id);
  const subjectsData: Array<{
    bgmid: number;
    name: string;
    name_cn: string | null;
    poster: string | null;
    subject_id: number;
    anime_id: number | null;
  }> = [];

  if (subjectIds.length > 0) {
    const subRows = await db
      .select({
        id: subjects.id,
        bgmid: subjects.bgmid,
        name: subjects.name,
        name_cn: subjects.name_cn,
        image_large: subjects.image_large,
      })
      .from(subjects)
      .where(inArray(subjects.id, subjectIds));

    // Get anime poster for each subject
    const bgmids = subRows.map(r => r.bgmid);
    const animeRows = bgmids.length > 0 ? await db
      .select({ id: anime.id, bgmid: anime.bgmid, poster: anime.poster })
      .from(anime)
      .where(and(eq(anime.deleted, 0), inArray(anime.bgmid, bgmids.map(String)))) : [];

    const animeMap = new Map(animeRows.map(r => [parseInt(r.bgmid ?? "0", 10), r]));

    for (const sub of subRows) {
      const localAnime = animeMap.get(sub.bgmid);
      subjectsData.push({
        bgmid: sub.bgmid,
        name: sub.name,
        name_cn: sub.name_cn,
        poster: localAnime?.poster ?? null,
        subject_id: sub.id,
        anime_id: localAnime?.id ?? null,
      });
    }
  }

  const subjectIdToData = new Map(subjectsData.map(s => [s.subject_id, s]));

  const scpRows = subjectIds.length > 0 ? await db
    .select({
      subject_id: subjectCharacterPersons.subject_id,
      person_id: subjectCharacterPersons.person_id,
    })
    .from(subjectCharacterPersons)
    .where(and(
      eq(subjectCharacterPersons.character_id, id),
      inArray(subjectCharacterPersons.subject_id, subjectIds)
    )) : [];

  const personIds = [...new Set(scpRows.map(r => r.person_id))];
  const personsData: Map<number, { id: number; name: string; image_large: string | null; image_medium: string | null; image_small: string | null; image_grid: string | null }> = new Map();

  if (personIds.length > 0) {
    const pRows = await db
      .select({
        id: persons.id,
        name: persons.name,
        image_large: persons.image_large,
        image_medium: persons.image_medium,
        image_small: persons.image_small,
        image_grid: persons.image_grid,
      })
      .from(persons)
      .where(inArray(persons.id, personIds));

    for (const p of pRows) {
      personsData.set(p.id, p);
    }
  }

  // Get careers
  const careerRows = personIds.length > 0 ? await db
    .select()
    .from(personCareers)
    .where(inArray(personCareers.person_id, personIds)) : [];

  const careerMap = new Map<number, string[]>();
  for (const c of careerRows) {
    if (!careerMap.has(c.person_id)) careerMap.set(c.person_id, []);
    careerMap.get(c.person_id)!.push(c.career);
  }

  const actorRowsBySubject = new Map<number, typeof scpRows>();
  for (const row of scpRows) {
    const rows = actorRowsBySubject.get(row.subject_id) ?? [];
    rows.push(row);
    actorRowsBySubject.set(row.subject_id, rows);
  }

  const subjectList = scRows.map(sc => {
    const sub = subjectIdToData.get(sc.subject_id);
    return {
      anime_id: sub?.anime_id ?? null,
      bgmid: sub?.bgmid ?? 0,
      name: sub?.name ?? "",
      name_cn: sub?.name_cn ?? null,
      poster: sub?.poster ?? null,
      relation: sc.relation,
      actors: (actorRowsBySubject.get(sc.subject_id) ?? []).map(cp => {
        const p = personsData.get(cp.person_id);
        return {
          id: cp.person_id,
          name: p?.name ?? "",
          images: rewriteImages(p?.image_large, p?.image_medium, p?.image_small, p?.image_grid),
          careers: careerMap.get(cp.person_id) ?? [],
        };
      }),
    };
  });

  return {
    id: char.id,
    name: char.name,
    name_cn: char.name_cn,
    type: char.type,
    summary: char.summary,
    images: rewriteImages(char.image_large, char.image_medium, char.image_small, char.image_grid),
    subjects: subjectList,
  };
}

export async function getPersonDetail(id: number): Promise<BangumiWikiPersonResult | null> {
  const [person] = await db.select().from(persons).where(eq(persons.id, id)).limit(1);
  if (!person) return null;

  // Careers
  const careerRows = await db.select().from(personCareers).where(eq(personCareers.person_id, id));
  const careers = careerRows.map(c => c.career);

  const scpRows = await db
    .select({
      character_id: subjectCharacterPersons.character_id,
      subject_id: subjectCharacterPersons.subject_id,
    })
    .from(subjectCharacterPersons)
    .where(eq(subjectCharacterPersons.person_id, id));

  const charIds = [...new Set(scpRows.map(r => r.character_id))];

  const charList: BangumiWikiPersonResult["characters"] = [];

  if (charIds.length > 0) {
    const charRows = await db
      .select({
        id: characters.id,
        name: characters.name,
        name_cn: characters.name_cn,
        image_large: characters.image_large,
        image_medium: characters.image_medium,
        image_small: characters.image_small,
        image_grid: characters.image_grid,
      })
      .from(characters)
      .where(inArray(characters.id, charIds));

    const charMap = new Map(charRows.map(c => [c.id, c]));

    const scRows = await db
      .select({
        character_id: subjectCharacters.character_id,
        subject_id: subjectCharacters.subject_id,
        relation: subjectCharacters.relation,
      })
      .from(subjectCharacters)
      .where(inArray(subjectCharacters.subject_id, [...new Set(scpRows.map(r => r.subject_id))]));

    const voicedSubjectKeys = new Set(scpRows.map(r => `${r.subject_id}:${r.character_id}`));
    const voicedScRows = scRows.filter(sc => voicedSubjectKeys.has(`${sc.subject_id}:${sc.character_id}`));

    const subjectIds = [...new Set(voicedScRows.map(r => r.subject_id))];

    let subjectMap = new Map<number, { anime_id: number | null; bgmid: number; name: string; name_cn: string | null; poster: string | null }>();

    if (subjectIds.length > 0) {
      const subRows = await db
        .select({
          id: subjects.id,
          bgmid: subjects.bgmid,
          name: subjects.name,
          name_cn: subjects.name_cn,
          image_large: subjects.image_large,
        })
        .from(subjects)
        .where(inArray(subjects.id, subjectIds));

      const bgmids = subRows.map(r => r.bgmid);
      const animeRows = bgmids.length > 0 ? await db
        .select({ id: anime.id, bgmid: anime.bgmid, poster: anime.poster })
        .from(anime)
        .where(and(eq(anime.deleted, 0), inArray(anime.bgmid, bgmids.map(String)))) : [];

      const animeMap = new Map(animeRows.map(r => [parseInt(r.bgmid ?? "0", 10), r]));

      for (const sub of subRows) {
        const localAnime = animeMap.get(sub.bgmid);
        subjectMap.set(sub.id, {
          anime_id: localAnime?.id ?? null,
          bgmid: sub.bgmid,
          name: sub.name,
          name_cn: sub.name_cn,
          poster: localAnime?.poster ?? null,
        });
      }
    }

    // Group by character
    const scByChar = new Map<number, Array<{ subject_id: number; relation: string | null }>>();
    for (const sc of voicedScRows) {
      const existing = scByChar.get(sc.character_id) || [];
      existing.push({ subject_id: sc.subject_id, relation: sc.relation });
      scByChar.set(sc.character_id, existing);
    }

    for (const charId of charIds) {
      const charData = charMap.get(charId);
      if (!charData) continue;

      const scs = scByChar.get(charId) || [];
      for (const sc of scs) {
        const sub = subjectMap.get(sc.subject_id);
        charList.push({
          character_id: charData.id,
          name: charData.name,
          name_cn: charData.name_cn,
          images: rewriteImages(charData.image_large, charData.image_medium, charData.image_small, charData.image_grid),
          relation: sc.relation,
          subject: sub ?? null,
        });
      }
    }
  }

  return {
    id: person.id,
    name: person.name,
    type: person.type,
    short_summary: person.short_summary,
    locked: person.locked === 1,
    images: rewriteImages(person.image_large, person.image_medium, person.image_small, person.image_grid),
    careers,
    characters: charList,
  };
}
