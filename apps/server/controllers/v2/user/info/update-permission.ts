import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { updatePermissionBodySchema } from "../../../../schemas/v2/user/info/update-permission.js";
import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";
import { log } from "../../../../common/tools/logger.js";

export async function updatePermission(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const body = parseBody(updatePermissionBodySchema, req, res);
  if (!body) return;
  const { permission, userID } = body;

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
