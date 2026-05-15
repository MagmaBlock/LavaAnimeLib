import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";
import { log } from "../../../../common/tools/logger.js";

export async function updateAvatar(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const { url } = req.body;

  let newUserData: Record<string, unknown>;
  if (user.data == null) newUserData = {};
  else newUserData = user.data;

  newUserData.avatar = { url };

  try {
    await updateUserData(newUserData, user.id);
    success(res, undefined);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
