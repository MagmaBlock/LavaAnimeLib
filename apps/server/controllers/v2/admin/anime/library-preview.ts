import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { previewLibrarySync } from "../../../../services/v2/anime/library-sync.js";

export async function adminAnimeLibraryPreview(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    success(res, await previewLibrarySync());
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
