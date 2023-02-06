import { promiseDB } from "../../../../common/sql.js"
import success from "../../response/2xx/success.js"
import wrongQuery from "../../response/4xx/wrongQuery.js"
import serverError from "../../response/5xx/serverError.js"
import { getAnimeByID } from "../get.js"

// 获取个人追番列表
// /v2/anime/follow/list
export async function getAnimeFollowListAPI(req, res) {
  let { status, page, pageSize } = req.body
  if (status == undefined || !status.length || page < 1 || pageSize < 1 || pageSize > 200) {
    return wrongQuery(res)
  }
  for (let code of status) {
    if (!Number.isInteger(code) || !(code >= 0 && code <= 2)) return wrongQuery(res)
  }
  if (!page) { // page 从 1 开始 
    page = 1
  }
  if (!pageSize) {
    pageSize = 15
  }


  let allRawResult = []
  for (let oneStatus of status) {
    try {
      let result = await promiseDB.query(
        "SELECT * FROM follow WHERE user_id = ? AND status = ? ORDER BY edit_time DESC, anime_id DESC LIMIT ?,?",
        [req.user.id, oneStatus, 0 + pageSize * (page - 1), pageSize]
      )
      for (let followRecord of result[0]) {
        console.log(followRecord.anime_id);
        allRawResult.push({
          status: followRecord.status,
          editTime: followRecord.edit_time.getTime(),
          anime: await getAnimeByID(followRecord.anime_id)
        })
      }
    } catch (error) {
      console.error(error);
      return serverError(res)
    }
  }

  success(res, allRawResult)
}