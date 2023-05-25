import axios from "axios";
import parseFileName from "anime-file-parser";

import { getDefaultDrive, getDrive } from "../drive/main.js";
import { getAnimeByID } from "./get.js";

/**
 * 获取指定动画指定节点文件列表的 API
 * @param {Number} laID
 * @param {String | undefined} drive
 * @returns {Array | String} String 为报错
 */
export async function getFilesByID(laID, drive) {
  // 根据 ID 获取某番剧目录下的文件和文件夹名

  // 获取动画信息
  let anime = await getAnimeByID(laID);
  if (anime.deleted) return "此 laID 不存在"; // 404

  // 获取 Drive 信息
  let thisDrive = getDrive(drive ?? getDefaultDrive());
  if (!thisDrive) return "存储节点不存在";
  if (anime?.type?.nsfw && thisDrive?.banNSFW)
    return "存储节点不支持当前类型动画"; // banNSFW

  let drivePath = thisDrive.path;
  let driveHost = thisDrive.host;

  // 请求 AList API
  let alistAPIResult = (
    await axios.post(
      "/api/fs/list",
      {
        path:
          drivePath +
          "/" +
          anime.index.year +
          "/" +
          anime.index.type +
          "/" +
          anime.index.name,
        password: thisDrive?.password,
      },
      {
        baseURL: driveHost,
      }
    )
  ).data;

  if (alistAPIResult.code == 200) {
    let thisDir = new Array(); // 存储解析后的文件列表结果
    let files = alistAPIResult.data.content;
    for (let i in files) {
      let thisFile = files[i];
      let thisFileInfo = {
        // 当前文件的信息
        name: thisFile.name,
        size: thisFile.size,
        updated: thisFile.modified,
        driver: alistAPIResult.data.provider,
        thumbnail: thisFile.thumb,
      };
      if (thisFile.is_dir == true) {
        // 文件夹处理
        thisDir.push({
          ...thisFileInfo,
          type: "dir",
        });
      } else {
        // 生成 URL
        let fileUrl = new URL(driveHost);
        fileUrl.pathname = joinPaths(
          "/d",
          drivePath,
          encodeURIComponent(anime.index.year),
          encodeURIComponent(anime.index.type),
          encodeURIComponent(anime.index.name),
          encodeURIComponent(thisFile.name)
        );
        fileUrl.searchParams.set("sign", thisFile.sign);

        thisDir.push({
          ...thisFileInfo,
          parseResult: parseFileName(thisFile.name),
          url: fileUrl,
          type: "file",
        });
      }
    }
    return thisDir;
  } else {
    console.error(
      alistAPIResult,
      `\nError: 请求 ${thisDrive.id} 节点时, AList 返回了非 200.`
    );
    return "请求存储节点时服务端发生意外错误";
  }
}

/**
 * 拼接路径段成一个路径字符串。
 * @param {...string} paths - 要拼接的路径段。
 * @returns {string} - 拼接后的路径字符串。
 */
function joinPaths(...paths) {
  return paths
    .map((path) => path.replace(/^\/|\/$/g, "")) // 移除开头和结尾的斜杠
    .filter((path) => path.length > 0) // 过滤空路径段
    .join("/"); // 使用斜杠拼接路径段
}
