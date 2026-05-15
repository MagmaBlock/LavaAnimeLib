import type { Request, Response } from "express";
import { getHeader as getHeaderService, updateHeader as updateHeaderService } from "../../../services/v2/home/header.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getHeader(req: Request, res: Response) {
  try {
    const data = await getHeaderService();
    success(res, data);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}

export async function updateHeader(req: Request, res: Response) {
  try {
    const newData = req.body.data;
    await updateHeaderService(newData);
    success(res, undefined);
  } catch (error) {
    if (error instanceof Error && error.message === "数据必须为数组") {
      return badRequest(res);
    }
    log.error(error);
    return serverError(res);
  }
}
