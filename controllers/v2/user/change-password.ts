import type { Request, Response } from "express";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { getFormattedPassword } from "../../../services/v2/user/password.js";
import { changeUserPassword } from "../../../services/v2/user/profile.js";
import { log } from "../../../common/tools/logger.js";

export async function changePassword(req: Request, res: Response) {
  try {
    await changeUserPassword(req.user!.id, getFormattedPassword(req.body.password));
    return success(res, null, "修改成功");
  } catch (error) {
    log.error(error, "用户密码修改时发生错误!");
    return serverError(res);
  }
}
