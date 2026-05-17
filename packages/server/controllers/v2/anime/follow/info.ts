import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { getAnimeFollowInfo as getAnimeFollowInfoService } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getAnimeFollowInfo(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const laID = Number(req.query.id);

  try {
    const result = await getAnimeFollowInfoService(user.id, laID);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
