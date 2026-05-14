import cache from "../../../common/cache.js";
import { promiseDB } from "../../../common/database/connection.js";

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

export async function checkEmailExists(email) {
  let result = await promiseDB.query(
    `SELECT * FROM user WHERE email = ?`,
    [email]
  );
  return result[0].length > 0;
}

export async function checkNameExists(name) {
  let result = await promiseDB.query(
    `SELECT * FROM user WHERE \`name\` = ?`,
    [name]
  );
  return result[0].length > 0;
}

export async function createUser(email, password, name) {
  let result = await promiseDB.query(
    `INSERT INTO user (email, password, \`name\`) VALUES (?, ?, ?)`,
    [email, password, name]
  );
  return result[0].affectedRows > 0;
}

export async function getNextUserID() {
  let queryResult = await promiseDB.query(
    `SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user'`
  );
  return queryResult[0][0].AUTO_INCREMENT;
}

export async function updateUserName(userID, name) {
  await promiseDB.query("UPDATE `user` SET name=? WHERE id=?", [
    name,
    userID,
  ]);
  delete cache.user[userID];
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
