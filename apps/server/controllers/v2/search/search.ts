import type { Request, Response } from "express";
import { parseQuery } from "../../../common/tools/parse-request.js";
import { searchAnimesQuerySchema } from "../../../schemas/v2/search/search.js";
import { searchAnimes as searchAnimesService } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function searchAnimes(req: Request, res: Response): Promise<void> {
  const query = parseQuery(searchAnimesQuerySchema, req, res);
  if (!query) return;
  const { value } = query;

  try {
    const searchResults = await searchAnimesService(value);
    success(res, searchResults);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
