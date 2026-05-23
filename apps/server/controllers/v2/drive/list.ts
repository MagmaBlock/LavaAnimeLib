import type { Request, Response } from "express";
import success from "../../../common/response/success.js";
import { getDriveList as getDriveListService } from "../../../services/v2/drive/index.js";

export async function getDriveList(req: Request, res: Response): Promise<void> {
  const latestDriveList = await getDriveListService();
  success(res, latestDriveList);
}
