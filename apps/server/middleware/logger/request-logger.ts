import type { Request, Response, NextFunction } from "express";
import { log } from "../../common/tools/logger.js";

export function requestStartRecorder(req: Request, res: Response, next: NextFunction): void {
  req.queryStart = new Date();
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const ref = req.get("Referer") || "无 Referer";

  res.once("finish", () => {
    log.info({
      ip: req.ip,
      user: req.user?.name || "访客",
      method: req.method,
      url: decodeURIComponent(req.originalUrl),
      referer: ref,
      durationMs: new Date().getTime() - (req.queryStart?.getTime() ?? 0),
    });
  });

  next();
}
