import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { createDrive } from "../../../../services/v2/admin/drive.js";
import { log } from "../../../../common/tools/logger.js";

export async function newDrive(req: Request, res: Response): Promise<void> {
  try {
    await createDrive(req.body);
    success(res, undefined, "创建成功");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
