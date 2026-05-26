import type { Request, Response } from "express";
import { parseQuery } from "../../../common/tools/parse-request.js";
import { quickSearchQuerySchema } from "../../../schemas/v2/search/quick.js";
import { quickSearch as quickSearchService } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function quickSearch(req: Request, res: Response): Promise<void> {
  const query = parseQuery(quickSearchQuerySchema, req, res);
  if (!query) return;
  const { value } = query;

  try {
    const searchResults = await quickSearchService(value);
    success(res, searchResults);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
