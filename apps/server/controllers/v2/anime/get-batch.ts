import type { Request, Response } from "express";
import { parseBody } from "../../../common/tools/parse-request.js";
import { getAnimesByIDBodySchema } from "../../../schemas/v2/anime/get-batch.js";
import { getAnimesByID as getAnimesByIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getAnimesByID(req: Request, res: Response): Promise<void> {
  const body = parseBody(getAnimesByIDBodySchema, req, res);
  if (!body) return;
  const { ids } = body;
  try {
    const result = await getAnimesByIDService(ids);
    success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
