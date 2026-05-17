import type { Request, Response } from "express";
import { getIndexInfo as getIndexInfoService } from "../../../services/v2/index/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export default async function getIndexInfo(req: Request, res: Response) {
  try {
    const indexData = await getIndexInfoService();
    success(res, indexData);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
