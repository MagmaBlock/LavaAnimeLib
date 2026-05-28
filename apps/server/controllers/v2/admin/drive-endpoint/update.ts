import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { updateEndpointBodySchema } from "../../../../schemas/v2/admin/drive-endpoint.js";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { updateEndpoint } from "../../../../services/v2/admin/drive-endpoint.js";
import { log } from "../../../../common/tools/logger.js";

export async function updateEndpointInfo(req: Request, res: Response): Promise<void> {
  const body = parseBody(updateEndpointBodySchema, req, res);
  if (!body) return;
  try {
    await updateEndpoint(body.id, body);
    success(res, undefined, "更新成功");
  } catch (error) {
    if (error instanceof Error && error.message === "端点不存在") {
      return notFound(res, error.message);
    }
    log.error(error);
    serverError(res);
  }
}
