import type { Request, Response } from "express";
import { getHotAnimes as getHotAnimesService } from "../../../services/v2/search/hot.js";
import success from "../../../common/response/success.js";

export async function getHotAnimes(req: Request, res: Response): Promise<void> {
  const result = await getHotAnimesService();
  success(res, result);
}
