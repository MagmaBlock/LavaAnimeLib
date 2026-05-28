import type { Request, Response } from "express";
import { parseQuery } from "../../../common/tools/parse-request.js";
import { getFilesByIDQuerySchema } from "../../../schemas/v2/anime/file.js";
import { getFilesByID as getFilesByIDService } from "../../../services/v2/anime/file.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import forbidden from "../../../common/response/forbidden.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getFilesByID(req: Request, res: Response): Promise<void> {
  const query = parseQuery(getFilesByIDQuerySchema, req, res);
  if (!query) return;
  const { id: laID, drive, endpoint } = query;

  try {
    const files = await getFilesByIDService(laID, drive, endpoint);

    if (Array.isArray(files)) {
      return success(res, files);
    } else if (typeof files === "string") {
      if (["此 laID 不存在", "存储节点不存在", "存储节点尚未配置连接", "连接配置不存在", "没有可用的对外节点"].includes(files)) {
        return notFound(res, files);
      }
      if (["存储节点不支持当前类型动画"].includes(files)) {
        return forbidden(res, files);
      }
      if (["请求存储节点时服务端发生意外错误"].includes(files)) {
        return serverError(res, files);
      }
    }
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
