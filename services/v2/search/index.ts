import _ from "lodash";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { like, and, desc, eq } from "drizzle-orm";
import { parseAnime } from "../parser/anime.js";

export async function searchAnimes(value) {
  let splitedValue = value.split(" ");

  let conditions = splitedValue.map((term) => {
    term = term.replace("%", "\\%");
    term = term.replace("_", "\\_");
    return like(anime.title, `%${term}%`);
  });
  conditions.push(eq(anime.deleted, 0));

  let searchResults = await db
    .select()
    .from(anime)
    .where(and(...conditions))
    .orderBy(desc(anime.views));

  return await parseAnime(searchResults);
}

export async function quickSearch(value) {
  if (!value) return [];
  let queryResults = await db
    .select({ title: anime.title })
    .from(anime)
    .where(and(like(anime.title, `%${value}%`), eq(anime.deleted, 0)))
    .orderBy(desc(anime.views));

  let quickSearchResults = [];
  for (let i of queryResults) {
    let thisTitle = i.title;
    if (thisTitle.startsWith(value)) quickSearchResults.push(i.title);
  }
  for (let i of queryResults) {
    let thisTitle = i.title;
    if (!thisTitle.startsWith(value)) quickSearchResults.push(i.title);
  }
  for (let i in quickSearchResults) {
    if (Number(i) >= 10) quickSearchResults[i] = "";
  }
  quickSearchResults = _.compact(quickSearchResults);
  return quickSearchResults;
}
