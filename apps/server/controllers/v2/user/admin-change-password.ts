import type { Request, Response } from "express";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { getFormattedPassword } from "../../../services/v2/user/password.js";
import { changeUserPassword } from "../../../services/v2/user/profile.js";
import { log } from "../../../common/tools/logger.js";

export async function adminChangePassword(req: Request, res: Response): Promise<void> {
  try {
    await changeUserPassword(req.body.userID, getFormattedPassword(req.body.password));
    return success(res, null, "修改成功");
  } catch (error) {
    log.error(error, "管理员修改用户密码时发生错误!");
    return serverError(res);
  }
}
