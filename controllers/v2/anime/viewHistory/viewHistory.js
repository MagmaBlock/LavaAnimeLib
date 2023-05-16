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
 * @throws {Error}
 */

import { promiseDB } from "../../../../common/sql.js";
import { parseFileName } from "../tag.js";

export async function recordViewHistory(
  userID,
  animeID,
  fileName,
  currentTime,
  totalTime,
  userIP,
  watchMethod
) {
  let isRecentWatch = await promiseDB.query(
    "SELECT count(*) FROM view_history vh WHERE userID = ? AND animeID = ? AND fileName = ? AND watchMethod = ? AND lastReportTime >= NOW() - INTERVAL 1 DAY;",
    [userID, animeID, fileName, watchMethod]
  );
  isRecentWatch = isRecentWatch[0][0]["count(*)"];

  // 如果最近一天内看过
  if (isRecentWatch) {
    // 更新已有的记录
    await promiseDB.query(
      "UPDATE view_history SET currentTime = ?, totalTime = ?, userIP = ?, lastReportTime = NOW() WHERE userID = ? AND animeID = ? AND fileName = ? AND watchMethod = ? AND lastReportTime >= NOW() - INTERVAL 1 DAY ORDER BY lastReportTime DESC LIMIT 1;",
      [currentTime, totalTime, userIP, userID, animeID, fileName, watchMethod]
    );
  } else {
    // 插入新记录
    await promiseDB.query(
      "INSERT INTO view_history ( userID, animeID, fileName, episode, currentTime, totalTime, userIP, watchMethod ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )",
      [
        userID,
        animeID,
        fileName,
        parseFileName(fileName).episode,
        currentTime,
        totalTime,
        userIP,
        watchMethod,
      ]
    );
  }
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
