import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { recordViewHistory } from "../../../../services/v2/anime/history.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function reportViewHistory(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const { animeID, fileName, currentTime, totalTime, watchMethod, useDrive } =
    req.body;

  try {
    await recordViewHistory(
      user.id,
      animeID,
      fileName,
      currentTime,
      totalTime,
      req.ip || "",
      watchMethod,
      useDrive
    );
  } catch (error) {
    log.error(error);
    return serverError(res);
  }

  return success(res, undefined);
}
