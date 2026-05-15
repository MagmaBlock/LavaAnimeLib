import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { like, desc, eq, and } from "drizzle-orm";

interface IndexData {
  year: string[];
  type: string[];
}

export async function getIndexInfo(): Promise<IndexData> {
  const indexData: IndexData = {
    year: [],
    type: [],
  };

  const allYears = await db
    .select({ year: anime.year })
    .from(anime)
    .orderBy(anime.year);
  const allTypes = await db.select({ type: anime.type }).from(anime);

  for (const i of allYears) {
    indexData.year.push(i.year);
  }
  for (const i of allTypes) {
    indexData.type.push(i.type);
  }

  indexData.type = indexData.type.sort().sort((a, b) => {
    return a.match(/\d{1,2}|./)![0] as unknown as number - (b.match(/\d{1,2}|./)![0] as unknown as number);
  });

  return indexData;
}

export async function queryAnimeByIndex(year?: string, type?: string) {
  const conditions = [eq(anime.deleted, 0)];
  if (year) conditions.push(like(anime.year, year));
  if (type) conditions.push(like(anime.type, type));

  const rows = await db
    .select()
    .from(anime)
    .where(and(...conditions))
    .orderBy(desc(anime.views));

  return rows;
}
