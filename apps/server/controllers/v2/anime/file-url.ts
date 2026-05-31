import type { Request, Response } from "express";
import { parseQuery } from "../../../common/tools/parse-request.js";
import { getFileUrlQuerySchema } from "../../../schemas/v2/anime/file-url.js";
import { getFileDownloadUrl } from "../../../services/v2/anime/file-url.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";
import { log } from "../../../common/tools/logger.js";

export async function getFileUrl(req: Request, res: Response): Promise<void> {
  const query = parseQuery(getFileUrlQuerySchema, req, res);
  if (!query) return;

  try {
    const url = await getFileDownloadUrl(query.drive, query.path, query.endpoint);
    success(res, { url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (["存储节点不存在", "没有可用的对外节点"].includes(message)) {
      return notFound(res, message);
    }
    log.error(error, `获取文件下载链接失败: drive=${query.drive} path=${query.path}`);
    return serverError(res, message);
  }
}
