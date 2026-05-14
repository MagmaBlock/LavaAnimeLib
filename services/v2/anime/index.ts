import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { eq, and } from "drizzle-orm";
import { parseAnime } from "../parser/anime.js";

export async function getAnimeByID(laID, full = false) {
  if (!isFinite(laID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    let rows = await db
      .select()
      .from(anime)
      .where(and(eq(anime.id, laID), eq(anime.deleted, 0)));

    if (rows.length) {
      let parsedAnime = await parseAnime(rows[0], full);
      return parsedAnime[0];
    } else {
      return { id: laID, title: "已失效的番剧", deleted: true };
    }
  } catch (error) {
    throw error;
  }
}

export async function getAnimesByID(array) {
  let resultList = [];
  for (let id of array) {
    resultList.push(await getAnimeByID(id));
  }
  return resultList;
}

export async function getAnimesByBgmID(bgmID) {
  if (!isFinite(bgmID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    let rows = await db
      .select()
      .from(anime)
      .where(and(eq(anime.bgmid, String(bgmID)), eq(anime.deleted, 0)));

    return parseAnime(rows);
  } catch (error) {
    throw error;
  }
}
