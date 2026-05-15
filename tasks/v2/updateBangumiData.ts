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

const reTry: Record<string, number> = {};

export async function updateAllBangumiData() {
  await repairBangumiDataID();
  const bgmIDListExpired = await findExpiredBangumiData();
  const bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable();
  const chunkedbgmIDList = _.chunk(bgmIDListExpired, 9);
  logger("[Bangumi Data] 需要刷新的 BgmID 列表", JSON.stringify(chunkedbgmIDList));

  for (const i in chunkedbgmIDList) {
    const task = [];
    for (const j in chunkedbgmIDList[i]) {
      task.push(updateBangumiData(chunkedbgmIDList[i][j], bgmIDListInAnimeTable));
    }
    await Promise.all(task);
  }
  logger("[Bangumi Data] Bangumi Data 刷新完成");
}

export async function repairBangumiDataID() {
  const bgmIDInAnime = await getAllBgmIDInAnimeTable();
  const bgmIDInData = await getAllBgmIdInBangumiDataTable();
  const diff = _.difference(bgmIDInAnime, bgmIDInData);

  logger(`[Bangumi Data] 修复缺失 BgmID: ${diff}`);
  for (const i in diff) await insertBgmIDBlankToDB(diff[i]);
}

export async function updateBangumiData(bgmID: number, bgmIDListInAnimeTable?: number[]) {
  if (!bgmID) throw new Error("No Bangumi ID provided!");
  if (!bgmIDListInAnimeTable)
    bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable();

  const thisSubject: {
    subject?: unknown;
    relations?: unknown;
    characters?: unknown;
  } = {};
  try {
    thisSubject.subject = await getBangumiSubjects(bgmID);
    thisSubject.relations = await getBangumiRelations(bgmID, bgmIDListInAnimeTable);
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

async function errorHanding(error: unknown, bgmID: number, bgmIDListInAnimeTable?: number[]) {
  const err = error as { request?: unknown; response?: { status?: number; data?: unknown } };
  if (err.request || err.response) {
    logger(err?.response?.status, err?.response?.data);
    if (!reTry[bgmID] || reTry[bgmID] < 10) {
      reTry[bgmID] = (reTry[bgmID] || 0) + 1;
      logger(`[Bangumi Data] bgm${bgmID} 抓取出错，准备重试 (${reTry[bgmID]})`);
      setTimeout(() => {
        updateBangumiData(bgmID, bgmIDListInAnimeTable);
      }, 1000);
    } else {
      logger(`[Bangumi Data] bgm${bgmID} 抓取出错超 10 次, 已放弃.`, error);
    }
  }
}
