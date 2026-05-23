import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { updateDrive } from "../../../../services/v2/admin/drive.js";
import { log } from "../../../../common/tools/logger.js";

export async function updateDriveInfo(req: Request, res: Response): Promise<void> {
  try {
    await updateDrive(req.body);
    success(res, undefined, "更新成功");
  } catch (error) {
    if (error instanceof Error && error.message === "存储节点不存在") {
      return notFound(res, error.message);
    }
    log.error(error);
    serverError(res);
  }
}
