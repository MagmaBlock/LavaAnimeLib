import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { fileIndexListQuerySchema } from "../../../../schemas/v2/admin/file-index.js";
import success from "../../../../common/response/success.js";
import { listDriveIndex } from "../../../../services/v2/admin/file-index-admin.js";

export async function adminListIndex(req: Request, res: Response): Promise<void> {
  const query = parseQuery(fileIndexListQuerySchema, req, res);
  if (!query) return;
  const result = await listDriveIndex(query.driveId, {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    parent: query.parent,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    type: query.type,
    deleted: query.deleted,
  });
  success(res, result);
}
