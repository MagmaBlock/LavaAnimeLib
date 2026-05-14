import { getAnimeFollowTotal as getAnimeFollowTotalService  } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

// 获取所有类型的追番数量
export async function getAnimeFollowTotal(req, res) {
  let userID = req.user.id;

  try {
    let result = await getAnimeFollowTotalService(userID);
    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
