import { getAnimesByBgmID as getAnimesByBgmIDService  } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";

// 根据 Bangumi ID 获取动画
export async function getAnimesByBgmID(req, res) {
  let bgmID = parseInt(req.query.bgmid);
  if (!Number.isInteger(bgmID) || bgmID <= 0) return badRequest(res);

  let result = await getAnimesByBgmIDService(bgmID);

  return success(res, result);
}
