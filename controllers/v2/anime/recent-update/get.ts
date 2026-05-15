import type { Request, Response } from "express";
import { getRecentUpdates as getRecentUpdatesService } from "../../../../services/v2/anime/recent-update.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function getRecentUpdates(req: Request, res: Response) {
  const { skip, take, ignoreDuplicate } = req.query;

  try {
    const result = await getRecentUpdatesService(
      Number(skip),
      Number(take),
      ignoreDuplicate as unknown as boolean
    );
    return success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
