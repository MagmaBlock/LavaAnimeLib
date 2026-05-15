import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";

export async function updateAvatar(req: Request, res: Response) {
  const { url } = req.body;

  let newUserData: Record<string, unknown>;
  if (req.user!.data == null) newUserData = {};
  else newUserData = req.user!.data;

  newUserData.avatar = { url };

  try {
    await updateUserData(newUserData, req.user!.id);
    success(res, undefined);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
