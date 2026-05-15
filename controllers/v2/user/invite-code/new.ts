import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import {
  generateInviteCode,
  saveInviteCode,
} from "../../../../services/v2/user/invite-code.js";
import { log } from "../../../../common/tools/logger.js";

export async function createUserInviteCode(req: Request, res: Response) {
  if (!req.user!.data?.permission?.admin) {
    return forbidden(res);
  }

  const { amount, expirationTime } = req.body;
  let inviteCodes: { code: string; expirationTime?: Date }[] = [];

  for (let i = 0; i < amount; i++) {
    inviteCodes.push({
      code: generateInviteCode(),
      expirationTime: expirationTime ? new Date(expirationTime) : undefined,
    });
  }

  for (const code of inviteCodes) {
    try {
      await saveInviteCode(code.code, req.user!.id, code.expirationTime);
    } catch (error) {
      log.error(error);
      inviteCodes = inviteCodes.filter((ele) => {
        return ele.code !== code.code;
      });
    }
  }

  return success(res, inviteCodes);
}
