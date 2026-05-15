import type { Request, Response } from "express";
import { searchAnimes as searchAnimesService } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function searchAnimes(req: Request, res: Response) {
  const value = req.query.value as string;

  try {
    const searchResults = await searchAnimesService(value);
    success(res, searchResults);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
