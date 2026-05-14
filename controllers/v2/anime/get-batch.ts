import { getAnimesByID as getAnimesByIDService  } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";

// 批量根据 laID Array 获取动画
export async function getAnimesByID(req, res) {
  let ids = req.body.ids;
  if (!Array.isArray(ids) || ids.length >= 80) return badRequest(res);
  try {
    let result = await getAnimesByIDService(ids);
    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
