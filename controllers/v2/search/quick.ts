import type { Request, Response } from "express";
import { quickSearch as quickSearchService } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";

export async function quickSearch(req: Request, res: Response) {
  const value = req.query.value as string;

  try {
    const searchResults = await quickSearchService(value);
    success(res, searchResults);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
