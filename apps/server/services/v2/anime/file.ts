import axios from "axios";
import parseFileName from "anime-file-parser";

import { getDefaultDrive, getDrive } from "../drive/index.js";
import { getAnimeByID } from "./index.js";
import { log } from "../../../common/tools/logger.js";

interface FileItem {
  name: string;
  size: number;
  updated: string;
  driver: string;
  thumbnail: string;
  type: "dir" | "file";
  parseResult?: ReturnType<typeof parseFileName>;
  url?: URL;
}

export async function getFilesByID(laID: number, drive?: string): Promise<FileItem[] | string> {
  const anime = await getAnimeByID(laID);
  if (anime.deleted) return "此 laID 不存在";

  const thisDrive = getDrive(drive ?? getDefaultDrive());
  if (!thisDrive) return "存储节点不存在";
  const animeType = anime.type as { nsfw?: boolean } | undefined;
  if (animeType?.nsfw && thisDrive?.banNSFW)
    return "存储节点不支持当前类型动画";
  const animeIndex = anime.index as { year: string; type: string; name: string };

  const drivePath = thisDrive.path;
  const driveHost = thisDrive.host;

  const alistAPIResult = (
    await axios.post(
      "/api/fs/list",
      {
        path: `${drivePath}/${animeIndex.year}/${animeIndex.type}/${animeIndex.name}`,
        password: thisDrive?.password,
      },
      { baseURL: driveHost }
    )
  ).data;

  if (alistAPIResult.code === 200) {
    const thisDir: FileItem[] = [];
    const files = alistAPIResult.data.content;
    for (const i in files) {
      const thisFile = files[i];
      const thisFileInfo = {
        name: thisFile.name,
        size: thisFile.size,
        updated: thisFile.modified,
        driver: alistAPIResult.data.provider,
        thumbnail: thisFile.thumb,
      };

      if (thisFile.is_dir) {
        thisDir.push({ ...thisFileInfo, type: "dir" });
      } else {
        const fileUrl = new URL(driveHost);
        fileUrl.pathname = joinPaths(
          "/d",
          drivePath,
          encodeURIComponent(animeIndex.year),
          encodeURIComponent(animeIndex.type),
          encodeURIComponent(animeIndex.name),
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
    if (alistAPIResult?.code === 500 && alistAPIResult?.message.match("not found")) {
      return [];
    }

    log.error(alistAPIResult, "请求 %s 节点时, AList 返回了非 200", thisDrive.id);
    return "请求存储节点时服务端发生意外错误";
  }
}

function joinPaths(...paths: string[]): string {
  return paths
    .map((path) => path.replace(/^\/|\/$/g, ""))
    .filter((path) => path.length > 0)
    .join("/");
}
