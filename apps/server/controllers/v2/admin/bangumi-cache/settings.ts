import type { Request, Response } from "express";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { updateBangumiCacheSettingsBodySchema } from "../../../../schemas/v2/admin/bangumi-cache.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";
import {
  getBangumiCacheSettings,
  updateBangumiCacheSettings,
} from "../../../../services/v2/bangumi/cache.js";

export async function getBangumiCacheSettingsController(_req: Request, res: Response): Promise<void> {
  try {
    success(res, await getBangumiCacheSettings());
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}

export async function updateBangumiCacheSettingsController(req: Request, res: Response): Promise<void> {
  const body = parseBody(updateBangumiCacheSettingsBodySchema, req, res);
  if (!body) return;
  try {
    success(res, await updateBangumiCacheSettings(body));
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
