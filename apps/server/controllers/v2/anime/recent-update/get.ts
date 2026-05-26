import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { getRecentUpdatesQuerySchema } from "../../../../schemas/v2/anime/recent-update/get.js";
import { getRecentUpdates as getRecentUpdatesService } from "../../../../services/v2/anime/recent-update.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getRecentUpdates(req: Request, res: Response): Promise<void> {
  const query = parseQuery(getRecentUpdatesQuerySchema, req, res);
  if (!query) return;
  const { skip, take, ignoreDuplicate } = query;

  try {
    const result = await getRecentUpdatesService(skip, take, ignoreDuplicate);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
