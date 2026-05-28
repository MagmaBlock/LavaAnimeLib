import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { fileIndexStatsQuerySchema } from "../../../../schemas/v2/admin/file-index.js";
import success from "../../../../common/response/success.js";
import { getDriveStats } from "../../../../services/v2/admin/file-index-admin.js";

export async function adminIndexStats(req: Request, res: Response): Promise<void> {
  const query = parseQuery(fileIndexStatsQuerySchema, req, res);
  if (!query) return;
  const stats = await getDriveStats(query.driveId);
  success(res, stats);
}
