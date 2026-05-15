import type { Request, Response, NextFunction } from "express";
import { findUserByID } from "../../services/v2/user/user.js";
import { useToken } from "../../services/v2/user/token.js";

export async function handleAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get("Authorization");
  if (authHeader) {
    const userID = await useToken(authHeader);
    if (userID) {
      req.user = await findUserByID(userID) || undefined;
    }
  }

  next();
}
