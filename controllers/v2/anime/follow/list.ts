import { getAnimeFollowList as getAnimeFollowListService  } from "../../../../services/v2/anime/follow.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";

// 获取个人追番列表
export async function getAnimeFollowList(req, res) {
  let { status, page, pageSize } = req.body;
  if (
    status == undefined ||
    !status.length ||
    page < 1 ||
    pageSize < 1 ||
    pageSize > 200
  ) {
    return badRequest(res);
  }
  for (let code of status) {
    if (!Number.isInteger(code) || !(code >= 0 && code <= 2))
      return badRequest(res);
  }
  if (!page) {
    // page 从 1 开始
    page = 1;
  }
  if (!pageSize) {
    pageSize = 15;
  }

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
