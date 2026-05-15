import type { Request, Response } from "express";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { testInviteCode, useInviteCode } from "../../../services/v2/user/invite-code.js";
import { getFormattedPassword } from "../../../services/v2/user/password.js";
import { checkEmailExists, checkNameExists, createUser, getNextUserID } from "../../../services/v2/user/user.js";
import { log } from "../../../common/tools/logger.js";

export async function userRegister(req: Request, res: Response): Promise<void> {
  const { email, password, name, inviteCode } = req.body;

  try {
    if (await checkEmailExists(email)) {
      return badRequest(res, "该邮箱已被注册");
    }

    if (await checkNameExists(name)) {
      return badRequest(res, "昵称已存在，请更换一个");
    }

    const inviteCodeStatus = await testInviteCode(inviteCode);
    if (
      inviteCodeStatus.real &&
      !inviteCodeStatus.used &&
      !inviteCodeStatus.expired
    ) {
      const nextUserID = await getNextUserID();
      await useInviteCode(inviteCode, nextUserID);
    } else {
      return badRequest(res, "邀请码不可用");
    }

    const saltyPassword = getFormattedPassword(password);
    const successCreate = await createUser(email, saltyPassword, name);
    if (successCreate) {
      success(res, undefined, "注册成功");
    } else {
      return serverError(res, "服务器错误，注册失败");
    }
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
