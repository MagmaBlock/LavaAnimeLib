import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { getAllDrivesForAdmin } from "../../../../services/v2/admin/drive.js";
import { log } from "../../../../common/tools/logger.js";

export async function getAllDrives(req: Request, res: Response): Promise<void> {
  try {
    success(res, await getAllDrivesForAdmin());
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
