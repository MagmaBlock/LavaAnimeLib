import { promiseDB } from "../../../../common/sql.js";
import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";
import { getFormattedPassword, isSecurePassword } from "./password.js";

/**
 * 修改密码的 API
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
export async function changePasswordAPI(req, res) {
  if (!req.body?.password) {
    return wrongQuery(res);
  }

  if (!isSecurePassword(req.body.password)) {
    return wrongQuery(res, "密码不合法, 密码至少包含字母, 且长度为7-64");
  }

  try {
    await promiseDB.query("UPDATE `user` SET password = ? WHERE id = ?", [
      getFormattedPassword(req.body.password),
      req.user?.id,
    ]);
    success(res, null, "修改成功");
  } catch (error) {
    console.error(error, "用户密码修改时发生错误!");
    serverError(res);
  }
}
