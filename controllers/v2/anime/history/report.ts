import { recordViewHistory } from "../../../../services/v2/anime/history.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

// 上报播放状态
export async function reportViewHistory(req, res) {
  let userID = req.user.id;
  let { animeID, fileName, currentTime, totalTime, watchMethod, useDrive } =
    req.body;

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
