import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { fileIndexRefreshDirBodySchema } from "../../../../schemas/v2/admin/file-index.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { prepareRefreshJob, executeRefresh } from "../../../../services/v2/admin/file-index-admin.js";
import { log } from "../../../../common/tools/logger.js";

export async function adminRefreshDir(req: Request, res: Response): Promise<void> {
  const body = parseBody(fileIndexRefreshDirBodySchema, req, res);
  if (!body) return;
  try {
    const result = prepareRefreshJob(body.driveId, body.dirPath);
    if ("busy" in result) {
      badRequest(res, "该存储节点正在刷新，请稍后再试");
      return;
    }
    await executeRefresh(result.job);
    success(res, undefined, "目录刷新完成");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
