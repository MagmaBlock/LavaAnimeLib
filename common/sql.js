/*
    数据库连接模块
*/

import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import { logger } from "./tools/logger.js";

// 先用无库连接创建数据库（解决 pool 配置了 database 但库还不存在的鸡生蛋问题）
await initDatabase();

const db = mysql.createPool(config.mysql);
const promiseDB = db.promise(); // mysql2 promise api

export default db;
export { promiseDB };

await checkDB();

async function initDatabase() {
  const { host, port, user, password, database } = config.mysql;

  // 用一个临时连接创建数据库
  const initConn = mysql.createConnection({ host, port, user, password });

  try {
    await initConn
      .promise()
      .query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    await initConn.promise().query(`USE \`${database}\``);

    // 读取并执行建表 SQL
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sqlPath = path.resolve(__dirname, "../sql/init.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // 先去掉注释行，再按分号拆分
    const cleanedSQL = sqlContent
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    const statements = cleanedSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await initConn.promise().query(statement);
    }

    logger("数据库表初始化完成");
  } catch (error) {
    console.error("数据库初始化失败:", error.message);
  } finally {
    await initConn.end();
  }
}

async function checkDB() {
  let test = await promiseDB.query("SELECT * FROM anime LIMIT 10");
  if (test[0].length) {
    logger("成功连接到数据库");
  }
}
