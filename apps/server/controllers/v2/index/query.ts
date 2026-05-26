import type { Request, Response } from "express";
import { parseBody } from "../../../common/tools/parse-request.js";
import { queryAnimeByIndexBodySchema } from "../../../schemas/v2/index/query.js";
import { queryAnimeByIndex as queryAnimeByIndexService } from "../../../services/v2/index/index.js";
import { parseAnime, type RawAnimeRow } from "../../../services/v2/parser/anime.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function queryAnimeByIndex(req: Request, res: Response): Promise<void> {
  const body = parseBody(queryAnimeByIndexBodySchema, req, res);
  if (!body) return;
  const { year, type } = body;

  try {
    const rawResults = await queryAnimeByIndexService(year, type);
    const result = await parseAnime(rawResults as RawAnimeRow[]);
    success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
