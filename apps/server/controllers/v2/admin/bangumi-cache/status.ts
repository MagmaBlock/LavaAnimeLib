import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { getBangumiCacheStatus } from "../../../../services/v2/bangumi/cache.js";

export async function getBangumiCacheStatusController(_req: Request, res: Response): Promise<void> {
  try {
    success(res, getBangumiCacheStatus());
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
