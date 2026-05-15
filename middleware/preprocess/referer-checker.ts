import chalk from "chalk";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../../common/tools/logger.js";
import forbidden from "../../common/response/forbidden.js";
import config from "../../common/config.js";

export function refererChecker(req: Request, res: Response, next: NextFunction) {
  const ref = req.get("Referer");

  if (!inRefererWhiteList(ref)) {
    logger("拦截了 Referer:", chalk.dim(ref ?? "空 Referer Header"));
    logger("UA:", chalk.dim(req.get("user-agent")));
    return forbidden(res);
  }

  next();
}

function inRefererWhiteList(referer: string | undefined): boolean {
  if (config.security.enableRefererWhiteList) {
    if (referer === undefined && config.security.allowEmptyReferer) return true;
    for (const rule of config.security.refererWhiteList) {
      if (referer?.match(rule)) {
        return true;
      }
    }
    return false;
  }
  return true;
}
