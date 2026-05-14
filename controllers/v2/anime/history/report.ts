import { recordViewHistory } from "../../../../services/v2/anime/history.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";

// 上报播放状态
export async function reportViewHistory(req, res) {
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
    return badRequest(res);

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

  return success(res, undefined);
}
