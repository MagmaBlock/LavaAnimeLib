import _ from "lodash";
import { db } from "../../common/database/connection.js";
import { bangumiData } from "../../common/database/schema/bangumi-data.js";
import { eq } from "drizzle-orm";
import {
  getBangumiCharacters,
  getBangumiRelations,
  getBangumiSubjects,
} from "./bangumiAPI.js";
import {
  findExpiredBangumiData,
  getAllBgmIDInAnimeTable,
  getAllBgmIdInBangumiDataTable,
  insertBgmIDBlankToDB,
} from "./bangumiDB.js";
import { logger } from "../../common/tools/logger.js";

let reTry: Record<string, number> = {};

export async function updateAllBangumiData() {
  await repairBangumiDataID();
  let bgmIDListExpired = await findExpiredBangumiData();
  let bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable();
  let chunkedbgmIDList = _.chunk(bgmIDListExpired, 9);
  logger(
    "[Bangumi Data] 需要刷新的 BgmID 列表",
    JSON.stringify(chunkedbgmIDList)
  );

  for (let i in chunkedbgmIDList) {
    let task = [];
    for (let j in chunkedbgmIDList[i]) {
      task.push(
        updateBangumiData(chunkedbgmIDList[i][j], bgmIDListInAnimeTable)
      );
    }
    await Promise.all(task);
  }
  logger("[Bangumi Data] Bangumi Data 刷新完成");
}

export async function repairBangumiDataID() {
  let bgmIDInAnime = await getAllBgmIDInAnimeTable();
  let bgmIDInData = await getAllBgmIdInBangumiDataTable();
  let diff = _.difference(bgmIDInAnime, bgmIDInData);

  logger(`[Bangumi Data] 修复缺失 BgmID: ${diff}`);
  for (let i in diff) await insertBgmIDBlankToDB(diff[i]);
}

export async function updateBangumiData(bgmID, bgmIDListInAnimeTable) {
  if (!bgmID) throw new Error("No Bangumi ID provided!");
  if (!bgmIDListInAnimeTable)
    bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable();

  let thisSubject: {
    subject?: unknown;
    relations?: unknown;
    characters?: unknown;
  } = {};
  try {
    thisSubject.subject = await getBangumiSubjects(bgmID);
    thisSubject.relations = await getBangumiRelations(
      bgmID,
      bgmIDListInAnimeTable
    );
    thisSubject.characters = await getBangumiCharacters(bgmID);
  } catch (error) {
    await errorHanding(error, bgmID, bgmIDListInAnimeTable);
    return;
  }

  await db
    .update(bangumiData)
    .set({
      subjects: JSON.stringify(thisSubject.subject),
      relations_anime: JSON.stringify(thisSubject.relations),
      characters: JSON.stringify(thisSubject.characters),
      update_time: new Date(),
    })
    .where(eq(bangumiData.bgmid, bgmID));
  logger(`[Bangumi Data] 成功刷新 bgm${bgmID}`);
  reTry[bgmID] = 0;
}

async function errorHanding(error, bgmID, bgmIDListInAnimeTable) {
  if (error.request || error.response) {
    logger(error?.response?.status, error?.response?.data);
    if (reTry[bgmID] < 10 || !reTry[bgmID]) {
      reTry[bgmID] = reTry[bgmID] + 1 || 0;
      logger(
        `[Bangumi Data] bgm${bgmID} 抓取出错，准备重试 (${reTry[bgmID]})`
      );
      setTimeout(() => {
        updateBangumiData(bgmID, bgmIDListInAnimeTable);
      }, 1000);
    } else {
      logger(
        `[Bangumi Data] bgm${bgmID} 抓取出错超 10 次, 已放弃.`,
        error,
      );
    }
  }
}
