import type { Request, Response } from "express";
import { parseQuery } from "../../../common/tools/parse-request.js";
import { getAnimeByIDQuerySchema } from "../../../schemas/v2/anime/get.js";
import { getAnimeByID as getAnimeByIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getAnimeByID(req: Request, res: Response): Promise<void> {
  const query = parseQuery(getAnimeByIDQuerySchema, req, res);
  if (!query) return;
  const { id, full } = query;

  try {
    const anime = await getAnimeByIDService(id, full);
    if (anime.deleted) return notFound(res);

    success(res, anime);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
