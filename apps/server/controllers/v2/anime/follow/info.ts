import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { getAnimeFollowInfoQuerySchema } from "../../../../schemas/v2/anime/follow/info.js";
import { getAnimeFollowInfo as getAnimeFollowInfoService } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getAnimeFollowInfo(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const query = parseQuery(getAnimeFollowInfoQuerySchema, req, res);
  if (!query) return;
  const { id: laID } = query;

  try {
    const result = await getAnimeFollowInfoService(user.id, laID);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
