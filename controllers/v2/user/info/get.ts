import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import success from "../../../../common/response/success.js";
import unauthorized from "../../../../common/response/unauthorized.js";
import { findUserByID } from "../../../../services/v2/user/user.js";

export async function getUserInfo(req: Request, res: Response) {
  if (!req.user) {
    return unauthorized(res);
  }
  const userID = req.query.userID as unknown as number | undefined;
  if (!userID) {
    const { password, ...safeUser } = req.user as User;
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
