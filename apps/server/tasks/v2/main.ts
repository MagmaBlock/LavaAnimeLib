import { db, pool } from "../../common/database/connection.js";
import { log } from "../../common/tools/logger.js";
import scanAllDrives from "./scan.js";

doAll();
async function doAll() {
  log.info("开始全量扫描文件系统索引...");
  await scanAllDrives();
  log.info("所有扫描任务已经完成! 将在 10 秒后关闭...");
  setTimeout(() => {
    pool.end();
  }, 10000);
}
