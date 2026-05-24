import type { Request, Response } from "express";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import { listUsers } from "../../../services/v2/user/admin.js";
import { log } from "../../../common/tools/logger.js";

export async function userList(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page);
  const pageSize = Number(req.query.pageSize);
  const offset = (page - 1) * pageSize;

  try {
    const { list, total } = await listUsers(offset, pageSize);
    return success(res, { list, total });
  } catch (error) {
    log.error(error, "获取用户列表时发生错误!");
    return serverError(res);
  }
}
