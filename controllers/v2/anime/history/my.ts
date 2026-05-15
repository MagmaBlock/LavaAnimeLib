import type { Request, Response } from "express";
import { getUserViewHistory } from "../../../../services/v2/anime/history.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function getMyViewHistory(req: Request, res: Response) {
  const { page, pageSize, animeID, withAnimeData, latestOnly } = req.body;
  const userID = req.user!.id;
  try {
    const historyData = await getUserViewHistory(
      userID,
      page,
      pageSize,
      animeID,
      latestOnly
    );

    if (withAnimeData) {
      for (const record of historyData) {
        (record as Record<string, unknown>).animeData = await getAnimeByID(record.animeID as number);
      }
    }

    return success(res, historyData);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
