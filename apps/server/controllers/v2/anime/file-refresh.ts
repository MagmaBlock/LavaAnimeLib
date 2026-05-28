import type { Request, Response } from "express";
import { parseBody } from "../../../common/tools/parse-request.js";
import { refreshFileIndexBodySchema } from "../../../schemas/v2/anime/file.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";
import { refreshAnimeFileIndex } from "../../../services/v2/anime/file.js";
import { log } from "../../../common/tools/logger.js";

export async function refreshFileIndex(req: Request, res: Response): Promise<void> {
  const body = parseBody(refreshFileIndexBodySchema, req, res);
  if (!body) return;
  try {
    await refreshAnimeFileIndex(body.id, body.drive);
    success(res, undefined, "文件索引已刷新");
  } catch (error) {
    if (error instanceof Error && error.message === "此 laID 不存在") {
      return notFound(res, error.message);
    }
    log.error(error);
    serverError(res);
  }
}
