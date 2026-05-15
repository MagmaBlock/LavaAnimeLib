import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { checkNameExists, updateUserName } from "../../../../services/v2/user/user.js";
import { log } from "../../../../common/tools/logger.js";

export async function updateName(req: Request, res: Response): Promise<void> {
  const { name } = req.body;
  const user = req.user!;
  if (user.name === name) {
    return badRequest(res, "更改的用户名不能和之前的相同");
  }

  try {
    if (await checkNameExists(name)) {
      return badRequest(res, "昵称已存在，请更换一个");
    }
  } catch (error) {
    log.error(error);
    return serverError(res);
  }

  try {
    await updateUserName(user.id, name);
    success(res, null, "更改成功");
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
