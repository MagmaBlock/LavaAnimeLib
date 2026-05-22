import type { Request, Response } from "express";
import { getAdminStats as getAdminStatsService } from "../../../services/v2/admin/stats.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const result = await getAdminStatsService();
    success(res, result);
  } catch (error) {
    log.error(error);
    serverError(res);
  }
}
