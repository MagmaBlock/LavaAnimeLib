import { db, pool } from "../../common/database/connection.js";
import { log } from "../../common/tools/logger.js";
import updateAnimes from "./updateAnimes.js";

doAll();
async function doAll() {
  log.info("开始从 AList 刷新番剧列表...");
  await updateAnimes();
  log.info("所有刷新任务已经完成! 将在 10 秒后关闭...");
  setTimeout(() => {
    pool.end();
  }, 10000);
}
