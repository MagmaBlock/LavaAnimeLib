import type { Request, Response } from "express";
import { parseBody } from "../../../common/tools/parse-request.js";
import { reportUploadMessageBodySchema } from "../../../schemas/v2/report/upload-message.js";
import { reportUploadMessage as reportUploadMessageService } from "../../../services/v2/report/upload-message.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function reportUploadMessage(req: Request, res: Response): Promise<void> {
  const body = parseBody(reportUploadMessageBodySchema, req, res);
  if (!body) return;
  const { index, fileName } = body;

  try {
    await reportUploadMessageService(index, fileName);
    return success(res, undefined);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
