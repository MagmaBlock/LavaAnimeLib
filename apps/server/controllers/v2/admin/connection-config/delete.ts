import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { deleteConnectionConfigBodySchema } from "../../../../schemas/v2/admin/connection-config.js";
import success from "../../../../common/response/success.js";
import notFound from "../../../../common/response/not-found.js";
import serverError from "../../../../common/response/server-error.js";
import { deleteConnectionConfig } from "../../../../services/v2/admin/connection-config.js";
import { log } from "../../../../common/tools/logger.js";

export async function removeConnectionConfig(req: Request, res: Response): Promise<void> {
  const body = parseBody(deleteConnectionConfigBodySchema, req, res);
  if (!body) return;
  try {
    await deleteConnectionConfig(body.id);
    success(res, undefined, "删除成功");
  } catch (error) {
    if (error instanceof Error && error.message === "连接配置不存在") {
      return notFound(res, error.message);
    }
    log.error(error);
    serverError(res);
  }
}
