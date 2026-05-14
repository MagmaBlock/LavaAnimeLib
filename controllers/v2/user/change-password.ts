import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { getFormattedPassword, isSecurePassword } from "../../../services/v2/user/password.js";
import { changeUserPassword } from "../../../services/v2/user/profile.js";

export async function changePassword(req, res) {
  if (!req.body?.password) {
    return badRequest(res);
  }

  if (!isSecurePassword(req.body.password)) {
    return badRequest(res, "密码不合法, 密码至少包含字母, 且长度为7-64");
  }

  try {
    await changeUserPassword(req.user?.id, getFormattedPassword(req.body.password));
    success(res, null, "修改成功");
  } catch (error) {
    console.error(error, "用户密码修改时发生错误!");
    serverError(res);
  }
}
