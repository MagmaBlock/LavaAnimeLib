import type { Request, Response } from "express";
import { getAnimeByID as getAnimeByIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getAnimeByID(req: Request, res: Response) {
  const laID = req.query.id as unknown as number;
  const full = (req.query.full || false) as boolean;

  try {
    const anime = await getAnimeByIDService(laID, full);
    if (anime.deleted) return notFound(res);

    success(res, anime);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
