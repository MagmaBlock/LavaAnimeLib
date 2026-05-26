import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { refreshBangumiCacheBodySchema } from "../../../../schemas/v2/admin/bangumi-cache.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import {
  refreshBangumiCache,
  refreshExpiredBangumiCaches,
} from "../../../../services/v2/bangumi/cache.js";

export async function refreshBangumiCacheController(req: Request, res: Response): Promise<void> {
  const body = parseBody(refreshBangumiCacheBodySchema, req, res);
  if (!body) return;
  const { bgmID } = body;
  try {
    await refreshBangumiCache(bgmID);
    success(res, { bgmID, refreshed: true });
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}

export async function refreshExpiredBangumiCacheController(_req: Request, res: Response): Promise<void> {
  try {
    const queued = await refreshExpiredBangumiCaches();
    success(res, { queued });
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
