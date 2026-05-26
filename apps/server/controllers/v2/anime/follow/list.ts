import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { getAnimeFollowListBodySchema } from "../../../../schemas/v2/anime/follow/list.js";
import { getAnimeFollowList as getAnimeFollowListService } from "../../../../services/v2/anime/follow.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getAnimeFollowList(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const body = parseBody(getAnimeFollowListBodySchema, req, res);
  if (!body) return;
  const { status, page, pageSize } = body;

  try {
    const allRawResult = await getAnimeFollowListService(user.id, status, page, pageSize);
    const result = [];
    for (const record of allRawResult) {
      result.push({
        status: record.status,
        editTime: record.editTime,
        anime: await getAnimeByID(record.animeID),
      });
    }
    success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
