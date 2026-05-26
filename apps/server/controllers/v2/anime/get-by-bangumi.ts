import type { Request, Response } from "express";
import { parseQuery } from "../../../common/tools/parse-request.js";
import { getAnimesByBgmIDQuerySchema } from "../../../schemas/v2/anime/get-by-bangumi.js";
import { getAnimesByBgmID as getAnimesByBgmIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getAnimesByBgmID(req: Request, res: Response): Promise<void> {
  const query = parseQuery(getAnimesByBgmIDQuerySchema, req, res);
  if (!query) return;
  const { bgmid: bgmID } = query;

  try {
    const result = await getAnimesByBgmIDService(bgmID);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
