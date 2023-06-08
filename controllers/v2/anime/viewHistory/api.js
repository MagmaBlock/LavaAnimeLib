import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";
import { getUserViewHistory, recordViewHistory } from "./viewHistory.js";

// /v2/anime/history/report
// 上报播放状态
export async function reportViewHistoryAPI(req, res) {
  let userID = req.user.id;
  let { animeID, fileName, currentTime, totalTime, watchMethod, useDrive } =
    req.body;

  if (
    !Number.isInteger(animeID) ||
    animeID < 1 ||
    currentTime < 0 ||
    totalTime < 0 ||
    currentTime > totalTime ||
    currentTime > 43200 ||
    totalTime > 43200 ||
    !fileName ||
    !watchMethod
  )
    return wrongQuery(res);

  if (typeof currentTime != "number") currentTime = null;
  if (typeof totalTime != "number") totalTime = null;

  try {
    await recordViewHistory(
      userID,
      animeID,
      fileName,
      currentTime,
      totalTime,
      req.ip,
      watchMethod,
      useDrive
    );
  } catch (error) {
    console.error(error);
    return serverError(res);
  }

  return success(res);
}

// /v2/anime/history/my
// 获取我的观看历史记录
export async function getMyViewHistoryAPI(req, res) {
  let { page, pageSize, animeID } = req.body;
  let userID = req.user.id;

  if (
    (page && typeof page != "number") ||
    (pageSize && typeof pageSize != "number") ||
    (animeID && typeof animeID != "number")
  ) {
    return wrongQuery(res);
  }

  success(res, await getUserViewHistory(userID, page, pageSize, animeID));
}
