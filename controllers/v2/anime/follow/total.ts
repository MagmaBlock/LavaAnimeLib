import type { Request, Response } from "express";
import { getAnimeFollowTotal as getAnimeFollowTotalService } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function getAnimeFollowTotal(req: Request, res: Response) {
  const userID = req.user!.id;

  try {
    const result = await getAnimeFollowTotalService(userID);
    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
