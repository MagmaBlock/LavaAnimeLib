import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { like, desc, eq, and } from "drizzle-orm";

export async function getIndexInfo() {
  let indexData = {
    year: [],
    type: [],
  };

  let allYears = await db
    .select({ year: anime.year })
    .from(anime)
    .orderBy(anime.year);
  let allTypes = await db
    .select({ type: anime.type })
    .from(anime);

  for (let i of allYears) {
    indexData.year.push(i.year);
  }
  for (let i of allTypes) {
    indexData.type.push(i.type);
  }

  indexData.type = indexData.type.sort().sort((a, b) => {
    return a.match(/\d{1,2}|./)[0] - b.match(/\d{1,2}|./)[0];
  });

  return indexData;
}

export async function queryAnimeByIndex(year, type) {
  let conditions = [eq(anime.deleted, 0)];
  if (year) conditions.push(like(anime.year, year));
  if (type) conditions.push(like(anime.type, type));

  let rows = await db
    .select()
    .from(anime)
    .where(and(...conditions))
    .orderBy(desc(anime.views));

  return rows;
}
