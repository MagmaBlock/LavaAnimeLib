import { promiseDB } from "../../common/sql.js";
import { logger } from "../../common/tools/logger.js";
import updateAnimes from "./updateAnimes.js";
import { updateAllBangumiData } from "./updateBangumiData.js";
import { updatePosters } from "./updatePosters.js";

doAll();
async function doAll() {
  logger("[定时刷新] 开始从 AList 刷新番剧列表...");
  await updateAnimes();
  logger("[定时刷新] 开始从 Bangumi API 刷新番剧信息...");
  await updateAllBangumiData();
  logger("[定时刷新] 开始刷新 Poster...");
  await updatePosters();
  logger("[定时刷新] 所有刷新任务已经完成! 将在 10 秒后关闭...");
  setTimeout(() => {
    promiseDB.end();
  }, 10000);
}
