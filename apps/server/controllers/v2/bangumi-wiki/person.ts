import type { Request, Response } from "express";
import { parseParams } from "../../../common/tools/parse-request.js";
import { bangumiWikiIdParamsSchema } from "../../../schemas/v2/bangumi-wiki/id.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";
import { getPersonDetail } from "../../../services/v2/bangumi-wiki/index.js";

export async function personDetail(req: Request, res: Response): Promise<void> {
  const params = parseParams(bangumiWikiIdParamsSchema, req, res);
  if (!params) return;
  const { id } = params;
  try {
    const result = await getPersonDetail(id);
    if (!result) return notFound(res);
    return success(res, result);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
