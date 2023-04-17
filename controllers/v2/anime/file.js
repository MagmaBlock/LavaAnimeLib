import axios from "axios";
import config from "../../../common/config.js";
import { getDriveHost, getDrivePath } from "../drive/main.js";
import { getAnimeByID } from "./get.js";
import { parseFileName } from "./tag.js";

export async function getFilesByID(laID, drive) {
  // 根据 ID 获取某番剧目录下的文件和文件夹名

  let anime = await getAnimeByID(laID);
  if (anime.deleted) return false; // 404

  let drivePath = getDrivePath(drive);
  let driveHost = getDriveHost(drive);

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
          config.alist.host +
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
    return false;
  }
}
