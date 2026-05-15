import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import config from "../config.js";
import { log } from "../tools/logger.js";

const { database: _database, ...initConfig } = config.mysql;
const initConn = mysql.createConnection(initConfig);

try {
  await initConn.promise().query(
    `CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_as_ci`
  );
  await initConn.promise().query(
    `ALTER DATABASE \`${config.mysql.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_as_ci`
  );
  await initConn.promise().query(`USE \`${config.mysql.database}\``);

  const initDb = drizzle({ client: initConn });
  await migrate(initDb, {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  log.info("数据库迁移完成");
} catch (error) {
  log.error(error, "数据库初始化失败");
  throw error;
} finally {
  await initConn.end();
}

const pool = mysql.createPool(config.mysql);
export const db = drizzle({ client: pool });

export default db;
export { pool };
