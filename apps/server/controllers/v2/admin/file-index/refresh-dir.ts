import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { fileIndexRefreshDirBodySchema } from "../../../../schemas/v2/admin/file-index.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { refreshDir } from "../../../../services/v2/admin/file-index-admin.js";
import { log } from "../../../../common/tools/logger.js";

export async function adminRefreshDir(req: Request, res: Response): Promise<void> {
  const body = parseBody(fileIndexRefreshDirBodySchema, req, res);
  if (!body) return;
  try {
    await refreshDir(body.driveId, body.dirPath);
    success(res, undefined, "目录刷新完成");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
