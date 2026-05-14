import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";

export async function updateAvatar(req, res) {
  let { url } = req.body;
  if (!url) return badRequest(res);
  try {
    url = new URL(url);
  } catch (error) {
    return badRequest(res, "无法识别, 请检查 URL 是否合法");
  }

  let newUserData;
  if (req.user.data == null) newUserData = {};
  else newUserData = req.user.data;

  newUserData.avatar = {
    url: url.href,
  };

  try {
    await updateUserData(newUserData, req.user.id);
  } catch (error) {
    serverError(res);
  }
  success(res, undefined);
}
