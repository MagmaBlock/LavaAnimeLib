import { getFilesByID as getFilesByIDService  } from "../../../services/v2/anime/file.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import forbidden from "../../../common/response/forbidden.js";
import serverError from "../../../common/response/server-error.js";

// 提供 laID 和 drive 获取番剧内容的 API
export async function getFilesByID(req, res) {
  let laID = req.query.id;
  let drive = req.query.drive;

  try {
    let files = await getFilesByIDService(laID, drive);

    // 正常返回 Array
    if (Array.isArray(files)) {
      return success(res, files);
    }

    // 出错返回的是 String
    else if (typeof files == "string") {
      if (["此 laID 不存在", "存储节点不存在"].includes(files)) {
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
    console.error(error);
    return serverError(res);
  }
}
