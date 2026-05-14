import { getAnimeFollowInfo as getAnimeFollowInfoService  } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";

// 查询追番状态
export async function getAnimeFollowInfo(req, res) {
  let laID = req.query?.id;
  laID = parseInt(laID);
  if (!laID || !Number.isInteger(laID) || laID < 0) return badRequest(res);

  try {
    let result = await getAnimeFollowInfoService(req.user.id, laID);
    return success(res, result);
  } catch (error) {
    console.error(error);
    serverError(res);
  }
}
