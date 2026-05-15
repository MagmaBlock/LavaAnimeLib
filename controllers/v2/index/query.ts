import type { Request, Response } from "express";
import { queryAnimeByIndex as queryAnimeByIndexService } from "../../../services/v2/index/index.js";
import { parseAnime } from "../../../services/v2/parser/anime.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function queryAnimeByIndex(req: Request, res: Response) {
  const { year, type } = req.body;

  try {
    const rawResults = await queryAnimeByIndexService(year, type);
    const result = await parseAnime(rawResults as Parameters<typeof parseAnime>[0]);
    success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
