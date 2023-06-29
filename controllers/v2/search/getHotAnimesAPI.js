import cache from "../../../common/cache.js";
import { promiseDB } from "../../../common/sql.js";
import { getAnimeByID } from "../anime/get.js";
import { animeParser } from "../parser/animeParser.js";
import success from "../response/2xx/success.js";

// 获取近期热门 (view 增量最大前十)
export async function getHotAnimesAPI(req, res) {
  let queryResult = await promiseDB.query(
    "SELECT vh.animeID, COUNT(*) watchCount, a.* FROM `view_history` vh JOIN anime a ON vh.animeID = a.id WHERE DATEDIFF(NOW(), vh.lastReportTime) <= 7 GROUP BY animeID ORDER BY watchCount DESC LIMIT 10"
  );

  let result = await animeParser(queryResult[0]);

  success(res, result);
}
