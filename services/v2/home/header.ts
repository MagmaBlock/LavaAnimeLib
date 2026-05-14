import { promiseDB } from "../../../common/database/connection.js";

export async function getHeader() {
  let dbResult = await promiseDB.query(
    "SELECT * FROM settings WHERE `key` = 'headerData'"
  );
  if (dbResult[0].length == 0) {
    return [];
  } else {
    return JSON.parse(dbResult[0][0].value);
  }
}

export async function updateHeader(newData) {
  // 必须为数组
  if (!Array.isArray(newData)) {
    throw new Error("数据必须为数组");
  }

  let dbResult = await promiseDB.query(
    "SELECT * FROM settings WHERE `key` = ?",
    ["headerData"]
  );
  if (dbResult[0].length == 0) {
    await promiseDB.query("INSERT INTO settings (`key`,value) VALUES (?,?)", [
      "headerData",
      JSON.stringify(newData),
    ]);
  } else {
    await promiseDB.query("UPDATE settings SET value=? WHERE `key`=?", [
      JSON.stringify(newData),
      "headerData",
    ]);
  }

  return true;
}
