import cache from "../../../common/cache.js";
import { promiseDB } from "../../../common/sql.js";

// 使用邮箱、用户名来找到可能的用户
export async function findUser(account) {
  let resultByEmail = await promiseDB.query(
    "SELECT * FROM user WHERE email = ? OR name = ?",
    [account, account]
  );
  if (resultByEmail[0].length) {
    let userData = dbUserParser(resultByEmail[0][0]);
    return userData;
  }
  return false;
}

// 使用 ID 查找用户
export async function findUserByID(userID) {
  if (!userID) return false;

  if (cache.user?.[userID]) {
    return dbUserParser(cache.user[userID]);
  }

  let findReult = await promiseDB.query("SELECT * FROM user WHERE id = ?", [
    userID,
  ]);
  findReult = findReult[0];
  if (findReult[0]) {
    // cache
    if (!cache.user) cache.user = {};
    cache.user[userID] = findReult[0];
    cache.user[userID].expirationTime = new Date(
      new Date().getTime() + 1000 * 60 * 5
    ); // 五分钟后过期
    return dbUserParser(findReult[0]);
  } else {
    return false;
  }
}

// 将数据库中的用户数据解析为对象
export function dbUserParser(userData) {
  try {
    userData.data = JSON.parse(userData.data);
    userData.settings = JSON.parse(userData.settings);
  } catch (error) {
    return userData;
  }
  return userData;
}
