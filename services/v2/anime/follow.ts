import { promiseDB } from "../../../common/database/connection.js";

export async function editAnimeFollow(userID, laID, status, remove) {
  // 如果请求删除此条追番
  if (remove === true) {
    await promiseDB.query(
      "DELETE FROM follow WHERE user_id = ? AND anime_id = ?",
      [userID, laID]
    );
    return { removed: true };
  }

  // 更改追番状态
  if (status !== undefined) {
    // 检查此追番是否已存在
    let isExist = await promiseDB.query(
      "SELECT * FROM follow WHERE user_id = ? AND anime_id = ?",
      [userID, laID]
    );
    if (isExist[0].length) {
      // 已存在 更新
      await promiseDB.query(
        "UPDATE follow SET status = ? WHERE user_id = ? AND anime_id = ?",
        [status, userID, laID]
      );
    } else {
      await promiseDB.query(
        // 新建
        "INSERT INTO follow (user_id,anime_id,status) VALUES (?,?,?)",
        [userID, laID, status]
      );
    }
    return { status };
  }

  return null;
}

export async function getAnimeFollowInfo(userID, laID) {
  let result = await promiseDB.query(
    "SELECT * FROM follow WHERE user_id = ? AND anime_id = ?",
    [userID, laID]
  );
  if (result[0].length == 0) {
    return { status: -1 };
  }
  if (result[0][0]) {
    return {
      status: result[0][0].status,
      editTime: result[0][0]?.edit_time?.getTime() ?? 0,
    };
  }
}

export async function getAnimeFollowList(userID, statusList, page, pageSize) {
  let allRawResult = [];
  for (let oneStatus of statusList) {
    let result = await promiseDB.query(
      "SELECT * FROM follow WHERE user_id = ? AND status = ? ORDER BY edit_time DESC, anime_id DESC LIMIT ?,?",
      [userID, oneStatus, 0 + pageSize * (page - 1), pageSize]
    );
    for (let followRecord of result[0]) {
      allRawResult.push({
        status: followRecord.status,
        editTime: followRecord.edit_time.getTime(),
        animeID: followRecord.anime_id,
      });
    }
  }
  return allRawResult;
}

export async function getAnimeFollowTotal(userID) {
  const allStatus = [0, 1, 2];
  let thisUserAllStatus = {};
  for (let status of allStatus) {
    let result = await promiseDB.query(
      "SELECT COUNT(*) FROM follow WHERE user_id = ? AND status = ?",
      [userID, status]
    );
    thisUserAllStatus[status] = result[0][0]["COUNT(*)"];
  }
  return thisUserAllStatus;
}
