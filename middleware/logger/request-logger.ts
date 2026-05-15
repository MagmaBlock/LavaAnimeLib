import chalk from "chalk";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../../common/tools/logger.js";

export function requestStartRecorder(req: Request, res: Response, next: NextFunction) {
  req.queryStart = new Date();
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const ref = req.get("Referer") || "无 Referer";

  res.once("finish", () => {
    logger(
      chalk.dim(req.ip),
      req.user ? chalk.dim(req.user.name) : chalk.cyan("访客"),
      chalk.bgGreenBright(" " + req.method + " "),
      decodeURIComponent(req.originalUrl),
      chalk.dim(ref),
      chalk.dim(new Date().getTime() - req.queryStart!.getTime(), "ms")
    );
  });

  next();
}
