import chalk from "chalk";
import { logger } from "../../common/tools/logger.js";

export function requestStartRecorder(req, res, next) {
  req.queryStart = new Date();
  next();
}

export function requestLogger(req, res, next) {
  let ref = req.get("Referer") || "无 Referer";

  res.once("finish", () => {
    // 打印 Log
    logger(
      chalk.dim(req.ip),
      req.user ? chalk.dim(req.user.name) : chalk.cyan("访客"),
      chalk.bgGreenBright(" " + req.method + " "),
      decodeURIComponent(req.originalUrl),
      chalk.dim(ref),
      chalk.dim(new Date() - req.queryStart, "ms")
    );
  });

  next();
}
