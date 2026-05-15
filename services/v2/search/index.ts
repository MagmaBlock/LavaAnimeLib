import _ from "lodash";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { like, and, desc, eq } from "drizzle-orm";
import { parseAnime } from "../parser/anime.js";

export async function searchAnimes(value: string) {
  const splitedValue = value.split(" ");

  const conditions = splitedValue.map((term) => {
    const escaped = term.replace("%", "\\%").replace("_", "\\_");
    return like(anime.title, `%${escaped}%`);
  });
  conditions.push(eq(anime.deleted, 0));

  const searchResults = await db
    .select()
    .from(anime)
    .where(and(...conditions))
    .orderBy(desc(anime.views));

  return await parseAnime(searchResults);
}

export async function quickSearch(value: string): Promise<string[]> {
  if (!value) return [];
  const queryResults = await db
    .select({ title: anime.title })
    .from(anime)
    .where(and(like(anime.title, `%${value}%`), eq(anime.deleted, 0)))
    .orderBy(desc(anime.views));

  const quickSearchResults: string[] = [];
  for (const i of queryResults) {
    if (i.title!.startsWith(value)) quickSearchResults.push(i.title!);
  }
  for (const i of queryResults) {
    if (!i.title!.startsWith(value)) quickSearchResults.push(i.title!);
  }
  for (const i in quickSearchResults) {
    if (Number(i) >= 10) quickSearchResults[i] = "";
  }
  return _.compact(quickSearchResults);
}
