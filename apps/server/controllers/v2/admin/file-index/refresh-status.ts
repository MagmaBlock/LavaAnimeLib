import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { fileIndexStatsQuerySchema } from "../../../../schemas/v2/admin/file-index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import { getRefreshStatus } from "../../../../services/v2/admin/file-index-admin.js";

export async function adminRefreshStatus(req: Request, res: Response): Promise<void> {
  const query = parseQuery(fileIndexStatsQuerySchema, req, res);
  if (!query) return;
  try {
    success(res, getRefreshStatus(query.driveId));
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
