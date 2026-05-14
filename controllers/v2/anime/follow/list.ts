import { getAnimeFollowList as getAnimeFollowListService  } from "../../../../services/v2/anime/follow.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

// 获取个人追番列表
export async function getAnimeFollowList(req, res) {
  let { status, page, pageSize } = req.body;

  try {
    let allRawResult = await getAnimeFollowListService(req.user.id, status, page, pageSize);
    for (let record of allRawResult) {
      record.anime = await getAnimeByID(record.animeID);
      delete record.animeID;
    }
    success(res, allRawResult);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
