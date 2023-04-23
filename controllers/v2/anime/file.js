import axios from "axios";
import { getDefaultDrive, getDrive } from "../drive/main.js";
import { getAnimeByID } from "./get.js";
import { parseFileName } from "./tag.js";

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
        // 普通文件
        let fileUrl =
          driveHost +
          "/d" +
          drivePath +
          "/" +
          encodeURIComponent(anime.index.year) +
          "/" +
          encodeURIComponent(anime.index.type) +
          "/" +
          encodeURIComponent(anime.index.name) +
          "/" +
          encodeURIComponent(thisFile.name) +
          "?sign=" +
          thisFile.sign;
        thisDir.push({
          ...thisFileInfo,
          ...parseFileName(thisFile.name),
          url: fileUrl,
          tempUrl: fileUrl,
          type: "file",
        });
      }
    }
    return thisDir;
  } else {
    console.error(alistAPIResult, `\nError: 请求 ${thisDrive.id} 节点时, AList 返回了非 200.`);
    return "请求存储节点时服务端发生意外错误";
  }
}
