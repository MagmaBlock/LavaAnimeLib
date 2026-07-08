import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { updateAnimeBodySchema } from "../../../../schemas/v2/admin/anime.js";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { updateAnime } from "../../../../services/v2/admin/anime.js";

export async function updateAnimeController(req: Request, res: Response): Promise<void> {
  const body = parseBody(updateAnimeBodySchema, req, res);
  if (!body) return;
  const { laID, ...patch } = body;
  try {
    const row = await updateAnime(laID, patch);
    success(res, row, "更新成功");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("不存在")) {
      log.error(error);
      return notFound(res, message);
    }
    log.error(error);
    serverError(res, message);
  }
}
