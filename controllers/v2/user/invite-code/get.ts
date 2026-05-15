import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import unauthorized from "../../../../common/response/unauthorized.js";
import serverError from "../../../../common/response/server-error.js";
import { getUserInviteCodes } from "../../../../services/v2/user/invite-code.js";

export async function getUserInviteCode(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res);
  }

  try {
    const codes = await getUserInviteCodes(req.user.id);
    success(res, codes);
  } catch (error) {
    serverError(res);
  }
}
