import type { Request, Response } from "express";
import success from "../../../../common/response/success.js";
import { getAllConnectionConfigs } from "../../../../services/v2/admin/connection-config.js";

export async function listConnectionConfigs(req: Request, res: Response): Promise<void> {
  const configs = await getAllConnectionConfigs();
  success(res, configs);
}
