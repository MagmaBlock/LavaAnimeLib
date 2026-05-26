import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { createDriveBodySchema } from "../../../../schemas/v2/admin/drive.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { createDrive } from "../../../../services/v2/admin/drive.js";
import { log } from "../../../../common/tools/logger.js";

export async function newDrive(req: Request, res: Response): Promise<void> {
  const body = parseBody(createDriveBodySchema, req, res);
  if (!body) return;
  try {
    await createDrive(body);
    success(res, undefined, "创建成功");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
