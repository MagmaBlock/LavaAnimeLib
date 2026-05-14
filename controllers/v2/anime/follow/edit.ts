import { editAnimeFollow as editAnimeFollowService  } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";

// 编辑我的追番
export async function editAnimeFollow(req, res) {
  let { id: laID, status, remove } = req.body;
  let userID = req.user.id;

  try {
    let result = await editAnimeFollowService(userID, laID, status, remove);
    if (result === null) {
      return badRequest(res, "请求了修改追番 API 但什么也没修改, 请检查参数是否正确");
    }
    return success(res, undefined);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
