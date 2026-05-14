import { db } from "../../common/database/connection.js";
import { bangumiData } from "../../common/database/schema/bangumi-data.js";
import { anime } from "../../common/database/schema/anime.js";
import { eq, and, sql } from "drizzle-orm";
import config from "../../common/config.js";
import { updateBangumiData } from "./updateBangumiData.js";
import { logger } from "../../common/tools/logger.js";
import _ from "lodash";

export async function findExpiredBangumiData() {
  let allBgmIDList = await db
    .select({
      bgmid: bangumiData.bgmid,
      update_time: bangumiData.update_time,
    })
    .from(bangumiData);

  let expiredbgmIDs = new Array();
  for (let i in allBgmIDList) {
    if (isExpired(allBgmIDList[i].update_time) && allBgmIDList[i].bgmid != 0) {
      expiredbgmIDs.push(allBgmIDList[i].bgmid);
    }
  }
  return expiredbgmIDs;
}

function isExpired(ts) {
  let cachedTime = new Date().getTime() - new Date(ts).getTime();
  if (cachedTime > 1000 * 60 * 60 * 24 * config.cache) return true;
  else return false;
}

export async function getAllBgmIDInAnimeTable() {
  let allBgmID = await db
    .select({ bgmid: anime.bgmid })
    .from(anime)
    .where(eq(anime.deleted, 0));

  let idList = new Array();
  allBgmID.forEach((value) => idList.push(parseInt(value.bgmid ?? "NaN")));
  idList = _.compact(idList);
  return idList;
}

export async function getAllBgmIdInBangumiDataTable() {
  let allBgmID = await db
    .select({
      bgmid: bangumiData.bgmid,
      update_time: bangumiData.update_time,
    })
    .from(bangumiData);

  let idList: number[] = [];
  allBgmID.forEach((value) => idList.push(value.bgmid));
  idList = _.compact(idList);
  return idList;
}

export async function insertBgmIDToDB(bgmID) {
  let isExist = await db
    .select({ bgmid: bangumiData.bgmid })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (isExist.length == 0) {
    await db.insert(bangumiData).values({ bgmid: bgmID });
    logger(`[Bangumi Data] 插入 bgm${bgmID} 到 Bangumi Data`);
    await updateBangumiData(bgmID, undefined);
  }
}

export async function insertBgmIDBlankToDB(bgmID) {
  let isExist = await db
    .select({ bgmid: bangumiData.bgmid })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (isExist.length == 0) {
    await db.insert(bangumiData).values({
      bgmid: bgmID,
      update_time: new Date(100000000),
    });
    logger(`[Bangumi Data] 插入Blank bgm${bgmID} 到 Bangumi Data`);
  }
}
