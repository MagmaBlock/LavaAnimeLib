import type { Request, Response, NextFunction } from "express";
import forbidden from "../../common/response/forbidden.js";
import unauthorized from "../../common/response/unauthorized.js";

export function requireLogin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.id) {
    next();
  } else {
    return unauthorized(res);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.data?.permission?.admin) {
    next();
  } else {
    return forbidden(res, "没有管理员权限");
  }
}
