import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";
import { log } from "../../../../common/tools/logger.js";

export async function updatePermission(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const { permission, userID } = req.body;

  if (!user.data?.permission?.admin) {
    return forbidden(res);
  }

  try {
    await updateUserData({ permission }, userID);
    success(res, undefined);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
