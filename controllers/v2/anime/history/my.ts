import { getUserViewHistory } from "../../../../services/v2/anime/history.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";

// 获取我的观看历史记录
export async function getMyViewHistory(req, res) {
  let { page, pageSize, animeID, withAnimeData, latestOnly } = req.body;
  let userID = req.user.id;

  if (
    (page && typeof page != "number") ||
    (pageSize && typeof pageSize != "number") ||
    (animeID && typeof animeID != "number")
  ) {
    return badRequest(res);
  }
  try {
    let historyData = await getUserViewHistory(
      userID,
      page,
      pageSize,
      animeID,
      latestOnly
    );

    // 需要附带动画信息
    if (withAnimeData) {
      for (let record of historyData) {
        record.animeData = await getAnimeByID(record.animeID);
      }
    }

    return success(res, historyData);
  } catch (error) {
    return serverError(res);
  }
}
