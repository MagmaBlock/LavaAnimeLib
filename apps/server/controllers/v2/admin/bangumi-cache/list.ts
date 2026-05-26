import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { listBangumiCacheQuerySchema } from "../../../../schemas/v2/admin/bangumi-cache.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { listBangumiCaches } from "../../../../services/v2/bangumi/cache.js";

export async function listBangumiCache(req: Request, res: Response): Promise<void> {
  const query = parseQuery(listBangumiCacheQuerySchema, req, res);
  if (!query) return;
  const { skip, take } = query;
  try {
    success(res, await listBangumiCaches(skip, take));
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
