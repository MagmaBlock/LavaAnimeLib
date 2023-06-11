/**
 * 记录播放行为的历史记录
 * 将自动判断是否需要覆写已存在的记录
 * @param {Number} userID
 * @param {Number} animeID
 * @param {String} fileName 播放视频的名称（读操作时，可解析信息）
 * @param {Number} currentTime 播放视频的当前进度（如果有）
 * @param {Number} totalTime 播放视频的总长度（如果有）
 * @param {String} userIP 用户的播放 IP
 * @param {String} watchMethod 用户播放方式
 * @param {String} useDrive 播放时的节点
 * @throws {Error}
 */

import { promiseDB } from "../../../../common/sql.js";
import parseFileName from "anime-file-parser";

export async function recordViewHistory(
  userID,
  animeID,
  fileName,
  currentTime,
  totalTime,
  userIP,
  watchMethod,
  useDrive
) {
  (async () => {
    let isNewViewResult = await isNewView(userID, animeID, fileName);
    if (isNewViewResult) {
      try {
        promiseDB.query(
          "UPDATE anime SET views = views + 1 WHERE id = ? AND deleted = 0",
          [animeID]
        );
      } catch (error) {
        console.error(error);
      }
    }
  })();

  await promiseDB.query(
    "INSERT INTO view_history ( userID, animeID, fileName, episode, currentTime, totalTime, userIP, watchMethod, useDrive ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? ) ON DUPLICATE KEY UPDATE currentTime = ?, totalTime = ?, userIP = ?, lastReportTime = NOW(), useDrive = ?;",
    [
      userID,
      animeID,
      fileName,
      parseFileName(fileName)?.episode,
      currentTime ? Math.round(currentTime) : null,
      totalTime ? Math.round(totalTime) : null,
      userIP,
      watchMethod,
      useDrive,
      // UPDATE
      currentTime ? Math.round(currentTime) : null,
      totalTime ? Math.round(totalTime) : null,
      userIP,
      useDrive,
    ]
  );
}

/**
 * 获取某个用户的历史记录
 * @param {Number} userID
 * @param {Number|undefined} page
 * @param {Number|undefined} pageSize
 * @param {Number|undefined} animeID 指定某个动画, 可选
 */
export async function getUserViewHistory(
  userID,
  page = 1,
  pageSize = 20,
  animeID
) {
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;

  let history;
  if (animeID) {
    history = await promiseDB.execute(
      "SELECT * FROM view_history vh WHERE userID = ? AND animeID = ? ORDER BY lastReportTime DESC LIMIT ?, ?;",
      [userID, animeID, (pageSize * (page - 1)).toString(), pageSize.toString()]
    );
  } else {
    history = await promiseDB.execute(
      "SELECT * FROM view_history vh WHERE userID = ? ORDER BY lastReportTime DESC LIMIT ?, ?;",
      [userID, (pageSize * (page - 1)).toString(), pageSize.toString()]
    );
  }
  history = history[0].map((historyRecord) => {
    delete historyRecord.userID;
    delete historyRecord.userIP;
    return historyRecord;
  });

  return history;
}

/**
 * 提供唯一主键 (即本函数的三个参数)
 * 判断是否是一个新鲜观看行为
 *
 * (同一个用户通过同一方式观看同一部番的同一部视频，72h 只能增加一次播放量)
 * @param {Number} userID
 * @param {Number} animeID
 * @param {String} fileName
 * @returns {Boolean} 是否是一个新观看
 */
export async function isNewView(userID, animeID, fileName) {
  try {
    let query = await promiseDB.execute(
      "SELECT count(*) FROM view_history vh WHERE userID = ? AND animeID = ? AND fileName = ? AND lastReportTime > DATE_SUB(NOW(), INTERVAL 72 HOUR);",
      [userID, animeID, fileName]
    );
    if (query[0][0]["count(*)"] == 0) {
      return true;
    } else if (query[0][0]["count(*)"] == 1) {
      return false;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
