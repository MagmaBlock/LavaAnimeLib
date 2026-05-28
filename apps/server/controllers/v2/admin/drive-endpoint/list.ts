import type { Request, Response } from "express";
import { parseQuery } from "../../../../common/tools/parse-request.js";
import { listEndpointsBodySchema } from "../../../../schemas/v2/admin/drive-endpoint.js";
import success from "../../../../common/response/success.js";
import { listEndpointsByDrive } from "../../../../services/v2/admin/drive-endpoint.js";

export async function listEndpoints(req: Request, res: Response): Promise<void> {
  const query = parseQuery(listEndpointsBodySchema, req, res);
  if (!query) return;
  const endpoints = await listEndpointsByDrive(query.driveId);
  success(res, endpoints);
}
