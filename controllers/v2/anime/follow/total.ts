import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { getAnimeFollowTotal as getAnimeFollowTotalService } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getAnimeFollowTotal(req: Request, res: Response): Promise<void> {
  const user = req.user as User;

  try {
    const result = await getAnimeFollowTotalService(user.id);
    success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
