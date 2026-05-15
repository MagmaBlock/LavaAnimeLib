import type { Request, Response } from "express";
import { reportUploadMessage as reportUploadMessageService } from "../../../services/v2/report/upload-message.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function reportUploadMessage(req: Request, res: Response) {
  const { index, fileName } = req.body;

  try {
    await reportUploadMessageService(index, fileName);
    return success(res, undefined);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
