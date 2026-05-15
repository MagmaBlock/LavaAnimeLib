import type { Request, Response } from "express";
import { deleteInviteCode } from "../../../../services/v2/admin/invite.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function deleteCodes(req: Request, res: Response) {
  const codes = req.body.codes;

  try {
    for (const code of codes) {
      await deleteInviteCode(code);
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }

  success(res, undefined);
}
