import type { Request, Response } from "express";
import { getAnimesByBgmID as getAnimesByBgmIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";

export async function getAnimesByBgmID(req: Request, res: Response) {
  const bgmID = req.query.bgmid as unknown as number;

  try {
    const result = await getAnimesByBgmIDService(bgmID);
    return success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
