import { promiseDB } from "../../../../common/sql.js";
import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";

// 查询追番状态
// /v2/anime/follow/info
export async function getAnimeFollowInfoAPI(req, res) {
  let laID = req.query?.id
  laID = parseInt(laID)
  if (!laID || !Number.isInteger(laID) || laID < 0) return wrongQuery(res)

  try {
    let result = await promiseDB.query(
      "SELECT * FROM follow WHERE user_id = ? AND anime_id = ?",
      [req.user.id, laID]
    )
    if (result[0].length == 0) { // 没追番
      return success(res, { status: -1 })
    }
    if (result[0][0]) { // 已追番
      return success(res, {
        status: result[0][0].status,
        editTime: result[0][0]?.edit_time?.getTime() ?? 0
      })
    }
  } catch (error) {
    console.error(error);
    serverError(res)
  }
}