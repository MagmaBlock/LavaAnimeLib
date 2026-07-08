import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { getAnimeAdminQuerySchema } from "../../../../schemas/v2/admin/anime.js";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { getAnimeAdmin } from "../../../../services/v2/admin/anime.js";

export async function getAnimeAdminController(req: Request, res: Response): Promise<void> {
  const query = parseQuery(getAnimeAdminQuerySchema, req, res);
  if (!query) return;
  try {
    const row = await getAnimeAdmin(query.laID);
    if (!row) return notFound(res, "番剧不存在");
    success(res, row);
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
