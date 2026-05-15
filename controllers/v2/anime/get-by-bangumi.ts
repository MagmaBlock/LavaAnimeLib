import type { Request, Response } from "express";
import { getAnimesByBgmID as getAnimesByBgmIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getAnimesByBgmID(req: Request, res: Response): Promise<void> {
  const bgmID = Number(req.query.bgmid);

  try {
    const result = await getAnimesByBgmIDService(bgmID);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
