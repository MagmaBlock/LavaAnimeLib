import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { setEpisodeStartBodySchema } from "../../../../schemas/v2/admin/anime.js";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { setAnimeEpisodeStart } from "../../../../services/v2/admin/anime.js";
import { log } from "../../../../common/tools/logger.js";

export async function setEpisodeStart(req: Request, res: Response): Promise<void> {
  const body = parseBody(setEpisodeStartBodySchema, req, res);
  if (!body) return;
  try {
    const result = await setAnimeEpisodeStart(body.laID, body.manual, body.episode_start);
    success(res, { episode_start: result }, "更新成功");
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