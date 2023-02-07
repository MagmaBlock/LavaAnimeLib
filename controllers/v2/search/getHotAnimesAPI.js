import cache from "../../../common/cache.js";
import { promiseDB } from "../../../common/sql.js";
import { getAnimeByID } from "../anime/get.js";
import success from "../response/2xx/success.js";

// 获取近期热门 (view 增量最大前十)
export async function getHotAnimesAPI(req, res) {
  let daysBefore = new Date().getTime() - 1000 * 60 * 60 * 24 * 7
  daysBefore = new Date(daysBefore)

  let queryResult = await promiseDB.query(`
    SELECT id, count(*) FROM \`views\` 
    WHERE time > ? GROUP BY id ORDER BY count(*) DESC`,
    [daysBefore]
  )
  let hotIDs = [] // 前十的 laID 数组
  queryResult[0].forEach((hot, index) => {
    if (index < 10) hotIDs.push(hot.id)
  })
  let hot = [] // 相应的 AnimeData
  for (let laID of hotIDs) {
    let thisAnimeData = await getAnimeByID(laID)
    if (!thisAnimeData?.deleted)
    hot.push(thisAnimeData)
  }

  success(res, hot)
}