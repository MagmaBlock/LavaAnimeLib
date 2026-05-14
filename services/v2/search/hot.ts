import { promiseDB } from "../../../common/database/connection.js";
import { parseAnime } from "../parser/anime.js";

export async function getHotAnimes() {
  let queryResult = await promiseDB.query(
    "SELECT vh.animeID, COUNT(*) watchCount, a.* FROM `view_history` vh JOIN anime a ON vh.animeID = a.id WHERE DATEDIFF(NOW(), vh.lastReportTime) <= 7 GROUP BY animeID ORDER BY watchCount DESC LIMIT 10"
  );

  return parseAnime(queryResult[0]);
}
