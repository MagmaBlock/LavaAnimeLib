import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { createConnectionConfigBodySchema } from "../../../../schemas/v2/admin/connection-config.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { createConnectionConfig } from "../../../../services/v2/admin/connection-config.js";
import { log } from "../../../../common/tools/logger.js";

export async function newConnectionConfig(req: Request, res: Response): Promise<void> {
  const body = parseBody(createConnectionConfigBodySchema, req, res);
  if (!body) return;
  try {
    const id = await createConnectionConfig(body);
    success(res, { id }, "创建成功");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
