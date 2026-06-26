import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { fileIndexRefreshDriveBodySchema } from "../../../../schemas/v2/admin/file-index.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { prepareRefreshJob, executeRefresh } from "../../../../services/v2/admin/file-index-admin.js";
import { log } from "../../../../common/tools/logger.js";

export async function adminRefreshDrive(req: Request, res: Response): Promise<void> {
  const body = parseBody(fileIndexRefreshDriveBodySchema, req, res);
  if (!body) return;
  try {
    const result = prepareRefreshJob(body.driveId, "");
    if ("busy" in result) {
      badRequest(res, "该存储节点正在刷新，请稍后再试");
      return;
    }
    executeRefresh(result.job).catch((err) => {
      log.error(err, "驱动 %s 异步索引刷新失败", body.driveId);
    });
    success(res, undefined, "已触发全量索引刷新");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
