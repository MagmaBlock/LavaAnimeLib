import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { listAnimeAdminQuerySchema } from "../../../../schemas/v2/admin/anime.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { listAnimeAdmin } from "../../../../services/v2/admin/anime.js";

export async function listAnimeAdminController(req: Request, res: Response): Promise<void> {
  const query = parseQuery(listAnimeAdminQuerySchema, req, res);
  if (!query) return;
  try {
    const result = await listAnimeAdmin(query);
    success(res, result);
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
