import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";

export async function updatePermission(req: Request, res: Response) {
  const { permission, userID } = req.body;

  if (!req.user!.data?.permission?.admin) {
    return forbidden(res);
  }

  try {
    await updateUserData({ permission }, userID);
    success(res, undefined);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
