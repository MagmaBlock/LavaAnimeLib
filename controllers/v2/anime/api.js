import { getFilesByID } from "./file.js";
import { getAnimeByID, getAnimesByBgmID, getAnimesByID } from "./get.js";
import { getAnimeView } from "./view.js";

import notFound from "../response/4xx/notFound.js";
import serverError from "../response/5xx/serverError.js";
import wrongQuery from "../response/4xx/wrongQuery.js";
import success from "../response/2xx/success.js";
import forbidden from "../response/4xx/forbidden.js";

// GET /v2/anime/get
export async function getAnimeByIDAPI(req, res) {
  let laID = req.query.id;
  if (!isFinite(laID)) return wrongQuery(res);
  let full = req.query.full || false;
  if (full) full = JSON.parse(req.query.full);

  try {
    let anime = await getAnimeByID(laID, full);
    if (anime.deleted) return notFound(res);

    success(res, anime);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}

// POST /v2/anime/get
// 批量根据 laID Array 获取动画
export async function getAnimesByIDAPI(req, res) {
  let ids = req.body.ids;
  if (!Array.isArray(ids) || ids.length >= 80) return wrongQuery(res);
  try {
    let result = await getAnimesByID(ids);
    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}

// GET /v2/anime/bangumi/get
// 根据 Bangumi ID 获取动画
export async function getAnimesByBgmIDAPI(req, res) {
  let bgmID = parseInt(req.query.bgmid);
  if (!Number.isInteger(bgmID) || bgmID <= 0) return wrongQuery(res);

  let result = await getAnimesByBgmID(bgmID);

  return success(res, result);
}

// GET /v2/anime/file
// 提供 laID 和 drive 获取番剧内容的 API
export async function getFilesByIDAPI(req, res) {
  let laID = req.query.id;
  let drive = req.query.drive;
  if (!Number.isInteger(laID) && laID <= 0) return wrongQuery(res);
  if (!drive) return wrongQuery(res);

  try {
    let files = await getFilesByID(laID, drive);

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

// /v2/anime/view/get
export async function getAnimeViewAPI(req, res) {
  let laID = req.query.id;
  if (!isFinite(laID)) return wrongQuery(res);

  try {
    let animeView = await getAnimeView(laID);
    if (animeView >= 0) {
      return success(res, { views: animeView, id: laID });
    } else if (animeView === false) {
      return notFound(res);
    } else {
      return serverError(res);
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
