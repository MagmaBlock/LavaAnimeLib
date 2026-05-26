import type { Request, Response } from "express";
import { parseBody } from "../../../common/tools/parse-request.js";
import { adminChangePasswordBodySchema } from "../../../schemas/v2/user/admin-change-password.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import notFound from "../../../common/response/not-found.js";
import { getFormattedPassword } from "../../../services/v2/user/password.js";
import { changeUserPassword } from "../../../services/v2/user/profile.js";
import { findUserByID } from "../../../services/v2/user/user.js";
import { log } from "../../../common/tools/logger.js";

export async function adminChangePassword(req: Request, res: Response): Promise<void> {
  const body = parseBody(adminChangePasswordBodySchema, req, res);
  if (!body) return;
  const { userID, password } = body;
  try {
    const targetUser = await findUserByID(userID);
    if (!targetUser) {
      return notFound(res, "用户不存在");
    }
    await changeUserPassword(userID, getFormattedPassword(password));
    return success(res, null, "修改成功");
  } catch (error) {
    log.error(error, "管理员修改用户密码时发生错误!");
    return serverError(res);
  }
}
