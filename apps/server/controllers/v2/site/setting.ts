import type { Request, Response } from "express";
import { getSiteSetting as getSiteSettingService, setSiteSetting as setSiteSettingService } from "../../../services/v2/site/setting.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getSiteSetting(req: Request, res: Response): Promise<void> {
  const key = req.query.key as string;

  try {
    const result = await getSiteSettingService(key);
    if (result !== null) {
      return success(res, result);
    } else {
      return notFound(res);
    }
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}

export async function setSiteSetting(req: Request, res: Response): Promise<void> {
  const { key, value } = req.body;

  try {
    await setSiteSettingService(key, value);
    return success(res, undefined);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
