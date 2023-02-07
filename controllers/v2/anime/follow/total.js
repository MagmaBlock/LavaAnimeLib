import { promiseDB } from "../../../../common/sql.js"
import success from "../../response/2xx/success.js"
import serverError from "../../response/5xx/serverError.js"

const allStatus = [0, 1, 2]

// 获取所有类型的追番数量
// /v2/anime/follow/total
export async function getAnimeFollowTotalAPI(req, res) {
  let userID = req.user.id

  let thisUserAllStatus = {}
  for (let status of allStatus) {
    try {
      let result = await promiseDB.query(
        'SELECT COUNT(*) FROM follow WHERE user_id = ? AND status = ?',
        [userID, status]
      )
      thisUserAllStatus[status] = result[0][0]['COUNT(*)']
    } catch (error) {
      return serverError(res)
    }
  }
  success(res, thisUserAllStatus)
} 
