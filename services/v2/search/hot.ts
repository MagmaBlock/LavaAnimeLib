import { db } from "../../../common/database/connection.js";
import { viewHistory } from "../../../common/database/schema/view-history.js";
import { anime } from "../../../common/database/schema/anime.js";
import { sql, eq, desc, getTableColumns, count } from "drizzle-orm";
import { parseAnime } from "../parser/anime.js";
import type { ParsedAnime } from "../parser/anime.js";

export async function getHotAnimes(): Promise<ParsedAnime[]> {
  const queryResult = await db
    .select({
      ...getTableColumns(anime),
      animeID: viewHistory.animeID,
      watchCount: count(),
    })
    .from(viewHistory)
    .innerJoin(anime, eq(viewHistory.animeID, anime.id))
    .where(sql`DATEDIFF(NOW(), ${viewHistory.lastReportTime}) <= 7`)
    .groupBy(viewHistory.animeID)
    .orderBy(desc(count()))
    .limit(10);

  return parseAnime(queryResult);
}
