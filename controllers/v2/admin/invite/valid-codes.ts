import type { Request, Response } from "express";
import { getAllValidCodes as getAllValidCodesService } from "../../../../services/v2/admin/invite.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function getAllValidCodes(req: Request, res: Response) {
  try {
    const result = await getAllValidCodesService();
    success(res, result);
  } catch (error) {
    serverError(res);
  }
}
