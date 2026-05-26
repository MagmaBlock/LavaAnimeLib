import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { getMyViewHistoryBodySchema } from "../../../../schemas/v2/anime/history/my.js";
import { getUserViewHistory } from "../../../../services/v2/anime/history.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getMyViewHistory(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const body = parseBody(getMyViewHistoryBodySchema, req, res);
  if (!body) return;
  const { page, pageSize, animeID, withAnimeData, latestOnly } = body;
  try {
    const historyData = await getUserViewHistory(
      user.id,
      page,
      pageSize,
      animeID,
      latestOnly
    );

    if (withAnimeData) {
      const enrichedData = [];
      for (const record of historyData) {
        enrichedData.push({
          ...record,
          animeData: await getAnimeByID(Number(record.animeID)),
        });
      }
      return success(res, enrichedData);
    }

    return success(res, historyData);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
