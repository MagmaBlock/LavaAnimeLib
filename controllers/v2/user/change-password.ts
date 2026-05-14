import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { getFormattedPassword } from "../../../services/v2/user/password.js";
import { changeUserPassword } from "../../../services/v2/user/profile.js";

export async function changePassword(req, res) {
  try {
    await changeUserPassword(req.user?.id, getFormattedPassword(req.body.password));
    return success(res, null, "修改成功");
  } catch (error) {
    console.error(error, "用户密码修改时发生错误!");
    return serverError(res);
  }
}
