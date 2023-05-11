import { promiseDB } from "../../../../common/sql.js";
import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";

// 编辑我的追番
// /v2/anime/follow/edit
export async function editAnimeFollowAPI(req, res) {
  let { id: laID, status, remove } = req.body;
  if (!laID || !Number.isInteger(laID) || laID < 1) return wrongQuery(res);
  let userID = req.user.id;

  // 如果请求删除此条追番
  if (remove === true) {
    try {
      await promiseDB.query(
        "DELETE FROM follow WHERE user_id = ? AND anime_id = ?",
        [userID, laID]
      );
    } catch (error) {
      console.error(error);
      return serverError(error);
    }

    return success(res);
    // end
  }

  // 更改追番状态
  if (status !== undefined) {
    if (!Number.isInteger(status) || !(status >= 0 && status <= 2))
      return wrongQuery(res);

    try {
      // 检查此追番是否已存在
      let isExist = await promiseDB.query(
        "SELECT * FROM follow WHERE user_id = ? AND anime_id = ?",
        [userID, laID]
      );
      if (isExist[0].length) {
        // 已存在 更新
        await promiseDB.query(
          "UPDATE follow SET status = ? WHERE user_id = ? AND anime_id = ?",
          [status, userID, laID]
        );
      } else {
        await promiseDB.query(
          // 新建
          "INSERT INTO follow (user_id,anime_id,status) VALUES (?,?,?)",
          [userID, laID, status]
        );
      }
    } catch (error) {
      console.error(error);
      return serverError(res);
    }

    return success(res);
  }

  wrongQuery(res, "请求了修改追番 API 但什么也没修改, 请检查参数是否正确");
}
