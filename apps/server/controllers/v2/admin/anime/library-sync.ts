import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { librarySyncBodySchema } from "../../../../schemas/v2/admin/anime.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import {
  applyLibrarySync,
  LibrarySyncRejectedError,
} from "../../../../services/v2/anime/library-sync.js";

export async function adminAnimeLibrarySync(
  req: Request,
  res: Response
): Promise<void> {
  const body = parseBody(librarySyncBodySchema, req, res);
  if (!body) return;

  try {
    const result = await applyLibrarySync(body);
    const missingSuffix =
      result.preview.missing.length > 0
        ? `；索引中未见 ${result.preview.missing.length} 部（仅诊断，未删除）`
        : "";
    success(
      res,
      result,
      `识别完成：新增 ${result.inserted}，恢复 ${result.restored}${missingSuffix}`
    );
  } catch (error) {
    if (error instanceof LibrarySyncRejectedError) {
      badRequest(res, error.message);
      return;
    }
    log.error(error);
    serverError(res);
  }
}
