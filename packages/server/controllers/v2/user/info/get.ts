import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import unauthorized from "../../../../common/response/unauthorized.js";
import { findUserByID } from "../../../../services/v2/user/user.js";

export async function getUserInfo(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    return unauthorized(res);
  }
  const rawUserID = req.query.userID;
  const userID = rawUserID != null ? Number(rawUserID) : undefined;
  if (userID == null) {
    const { password, ...safeUser } = req.user;
    success(res, safeUser);
  } else {
    const userData = await findUserByID(userID);
    if (userData) {
      const { password, ...safeUser } = userData;
      success(res, safeUser);
    } else {
      success(res, null);
    }
  }
}
