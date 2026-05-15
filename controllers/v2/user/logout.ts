import type { Request, Response } from "express";
import success from "../../../common/response/success.js";
import unauthorized from "../../../common/response/unauthorized.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { removeToken } from "../../../services/v2/user/token.js";

export async function userLogout(req: Request, res: Response) {
  const { all } = req.body;
  const token = req.get("Authorization");

  if (!token) return badRequest(res);

  try {
    const logout = await removeToken(token, all);
    if (logout) {
      success(res, undefined);
    } else {
      return unauthorized(res);
    }
  } catch (error) {
    return serverError(res);
  }
}
