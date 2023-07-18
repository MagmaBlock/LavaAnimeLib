import { promiseDB } from "../../../common/sql.js";
import { getAnimeByID } from "./get.js";
import { parseFileName } from "./tag.js";

export async function getAnimeView(laID) {
  // 传入 ID 并返回播放量
  if (!isFinite(laID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    let anime = await getAnimeByID(laID);
    if (!anime?.deleted) {
      let view = parseInt(anime.views);
      return view;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
}
