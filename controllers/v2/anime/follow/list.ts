import type { Request, Response } from "express";
import { getAnimeFollowList as getAnimeFollowListService } from "../../../../services/v2/anime/follow.js";
import { getAnimeByID } from "../../../../services/v2/anime/index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function getAnimeFollowList(req: Request, res: Response) {
  const { status, page, pageSize } = req.body;

  try {
    const allRawResult = await getAnimeFollowListService(req.user!.id, status, page, pageSize);
    for (const record of allRawResult) {
      (record as unknown as Record<string, unknown>).anime = await getAnimeByID(record.animeID);
      delete (record as unknown as Record<string, unknown>).animeID;
    }
    success(res, allRawResult);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
