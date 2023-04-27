import { promiseDB } from "../../../common/sql.js";
import { animeParser } from "../parser/animeParser.js";

/**
 * 根据 laID 获取番剧的数据
 * 是已经解析完成的结果
 * @param {Number} laID
 * @param {Boolean} full 为真时将会同时提供 tag、关联番剧等详细信息
 */
export async function getAnimeByID(laID, full = false) {
  // 传入 ID 返回数据库查询结果
  if (!isFinite(laID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    let queryResult = await promiseDB.query(
      "SELECT * FROM anime WHERE id = ? AND deleted = 0",
      [laID]
    );
    if (queryResult[0].length) {
      let parsedAnime = await animeParser(queryResult[0][0], full);
      return parsedAnime[0];
    } else {
      return { id: laID, title: "已失效的番剧", deleted: true };
    }
  } catch (error) {
    throw error;
  }
}

export async function getAnimesByID(array) {
  // 传入 ID 数组返回结果
  let resultList = [];
  for (let id of array) {
    resultList.push(await getAnimeByID(id));
  }
  return resultList;
}

/**
 * 根据 Bangumi ID 获取番剧，返回为数组
 * @param {Number} bgmID
 * @returns {Array<Object>}
 */
export async function getAnimesByBgmID(bgmID) {
  // 传入 ID 返回数据库查询结果
  if (!isFinite(bgmID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    let anime = await promiseDB.query(
      "SELECT * FROM anime WHERE bgmid = ? AND deleted = 0",
      [bgmID]
    );

    return animeParser(anime[0]);
  } catch (error) {
    throw error;
  }
}
