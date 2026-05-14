import { getAnimeFollowInfo as getAnimeFollowInfoService  } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

// 查询追番状态
export async function getAnimeFollowInfo(req, res) {
  let laID = req.query.id;

  try {
    let result = await getAnimeFollowInfoService(req.user.id, laID);
    return success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
