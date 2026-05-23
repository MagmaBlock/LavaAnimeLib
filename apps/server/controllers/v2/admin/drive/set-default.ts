import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { setDefaultDrive } from "../../../../services/v2/admin/drive.js";
import { log } from "../../../../common/tools/logger.js";

export async function setDefaultDriveController(req: Request, res: Response): Promise<void> {
  try {
    await setDefaultDrive(req.body.id);
    success(res, undefined, "已设为默认节点");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
