import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { createEndpointBodySchema } from "../../../../schemas/v2/admin/drive-endpoint.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { createEndpoint } from "../../../../services/v2/admin/drive-endpoint.js";
import { log } from "../../../../common/tools/logger.js";

export async function newEndpoint(req: Request, res: Response): Promise<void> {
  const body = parseBody(createEndpointBodySchema, req, res);
  if (!body) return;
  try {
    const id = await createEndpoint(body);
    success(res, { id }, "创建成功");
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
