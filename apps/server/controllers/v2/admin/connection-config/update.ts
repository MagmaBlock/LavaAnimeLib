import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { updateConnectionConfigBodySchema } from "../../../../schemas/v2/admin/connection-config.js";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { updateConnectionConfig } from "../../../../services/v2/admin/connection-config.js";
import { log } from "../../../../common/tools/logger.js";

export async function updateConnectionConfigInfo(req: Request, res: Response): Promise<void> {
  const body = parseBody(updateConnectionConfigBodySchema, req, res);
  if (!body) return;
  try {
    await updateConnectionConfig(body.id, body);
    success(res, undefined, "更新成功");
  } catch (error) {
    if (error instanceof Error && error.message === "连接配置不存在") {
      return notFound(res, error.message);
    }
    log.error(error);
    serverError(res);
  }
}
