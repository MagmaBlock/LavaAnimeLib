import _ from "lodash";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { subjects } from "../../../common/database/schema/subjects.js";
import { subjectAliases } from "../../../common/database/schema/subject-aliases.js";
import { like, and, desc, eq, or, sql } from "drizzle-orm";
import { parseAnime } from "../parser/anime.js";
import type { ParsedAnime } from "../parser/anime.js";

export async function searchAnimes(value: string): Promise<ParsedAnime[]> {
  const splitedValue = value.split(" ");

  const titleConditions = splitedValue.map((term) => {
    const escaped = term.replace("%", "\\%").replace("_", "\\_");
    return like(anime.title, `%${escaped}%`);
  });

  const aliasConditions = splitedValue.map((term) => {
    const escaped = term.replace("%", "\\%").replace("_", "\\_");
    return like(subjectAliases.alias, `%${escaped}%`);
  });

  const nameConditions = splitedValue.map((term) => {
    const escaped = term.replace("%", "\\%").replace("_", "\\_");
    return or(
      like(subjects.name, `%${escaped}%`),
      like(subjects.name_cn, `%${escaped}%`)
    );
  });

  const searchResults = await db
    .selectDistinct({
      id: anime.id,
      year: anime.year,
      type: anime.type,
      name: anime.name,
      views: anime.views,
      bgmid: anime.bgmid,
      nsfw: anime.nsfw,
      title: anime.title,
      deleted: anime.deleted,
      poster: anime.poster,
    })
    .from(anime)
    .leftJoin(subjects, eq(anime.bgmid, sql`cast(${subjects.bgmid} as char)`))
    .leftJoin(subjectAliases, eq(subjects.id, subjectAliases.subject_id))
    .where(
      and(
        eq(anime.deleted, 0),
        or(
          and(...titleConditions),
          and(...nameConditions),
          and(...aliasConditions)
        )
      )
    )
    .orderBy(desc(anime.views));

  return await parseAnime(searchResults);
}

export async function quickSearch(value: string): Promise<string[]> {
  if (!value) return [];

  const escaped = value.replace("%", "\\%").replace("_", "\\_");

  const queryResults = await db
    .selectDistinct({ title: anime.title })
    .from(anime)
    .leftJoin(subjects, eq(anime.bgmid, sql`cast(${subjects.bgmid} as char)`))
    .leftJoin(subjectAliases, eq(subjects.id, subjectAliases.subject_id))
    .where(
      and(
        eq(anime.deleted, 0),
        or(
          like(anime.title, `%${escaped}%`),
          like(subjects.name, `%${escaped}%`),
          like(subjects.name_cn, `%${escaped}%`),
          like(subjectAliases.alias, `%${escaped}%`)
        )
      )
    )
    .orderBy(desc(anime.views));

  const quickSearchResults: string[] = [];
  for (const i of queryResults) {
    if (!i.title) continue;
    if (i.title.startsWith(value)) quickSearchResults.push(i.title);
  }
  for (const i of queryResults) {
    if (!i.title) continue;
    if (!i.title.startsWith(value)) quickSearchResults.push(i.title);
  }
  for (const i in quickSearchResults) {
    if (Number(i) >= 10) quickSearchResults[i] = "";
  }
  return _.compact(quickSearchResults);
}
