/*
    数据库连接模块
*/

import mysql from "mysql2";
import config from "./config.js";
import { logger } from "./tools/logger.js";

const db = mysql.createPool(config.mysql);
const promiseDB = db.promise(); // mysql2 promise api

export default db;
export { promiseDB };

checkDB();
async function checkDB() {
  let test = await promiseDB.query("SELECT * FROM anime LIMIT 10");
  if (test[0].length) {
    logger("成功连接到数据库");
  }
}
