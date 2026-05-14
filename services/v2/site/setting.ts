import { promiseDB } from "../../../common/database/connection.js";

export async function getSiteSetting(key) {
  let queryResult = await promiseDB.execute(
    "SELECT * FROM settings WHERE `key` = ?",
    [key]
  );

  let result = queryResult[0][0];
  if (result !== undefined) {
    // 尝试解析 JSON
    try {
      return JSON.parse(result?.value);
    } catch (error) {
      // 如果此字符串无法解析, 直接返回字符串
      if (error instanceof SyntaxError) {
        return result?.value;
      } else {
        throw error;
      }
    }
  } else {
    return null;
  }
}

export async function setSiteSetting(key, value) {
  await promiseDB.query(
    "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
    [key, JSON.stringify(value), JSON.stringify(value)]
  );
  return true;
}
