import type { Request, Response } from "express";
import { getAnimeFollowInfo as getAnimeFollowInfoService } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getAnimeFollowInfo(req: Request, res: Response) {
  const laID = req.query.id as unknown as number;

  try {
    const result = await getAnimeFollowInfoService(req.user!.id, laID);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
