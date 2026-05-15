import { db } from "../../common/database/connection.js";
import { bangumiData } from "../../common/database/schema/bangumi-data.js";
import { anime } from "../../common/database/schema/anime.js";
import { eq, and, sql } from "drizzle-orm";
import config from "../../common/config.js";
import { updateBangumiData } from "./updateBangumiData.js";
import { log } from "../../common/tools/logger.js";
import _ from "lodash";

export async function findExpiredBangumiData() {
  const allBgmIDList = await db
    .select({
      bgmid: bangumiData.bgmid,
      update_time: bangumiData.update_time,
    })
    .from(bangumiData);

  const expiredbgmIDs: number[] = [];
  for (const i in allBgmIDList) {
    if (isExpired(allBgmIDList[i].update_time) && allBgmIDList[i].bgmid !== 0) {
      expiredbgmIDs.push(allBgmIDList[i].bgmid);
    }
  }
  return expiredbgmIDs;
}

function isExpired(ts: Date | null): boolean {
  const cachedTime = new Date().getTime() - new Date(ts!).getTime();
  return cachedTime > 1000 * 60 * 60 * 24 * config.cache;
}

export async function getAllBgmIDInAnimeTable() {
  const allBgmID = await db
    .select({ bgmid: anime.bgmid })
    .from(anime)
    .where(eq(anime.deleted, 0));

  const idList: number[] = [];
  allBgmID.forEach((value) => idList.push(parseInt(value.bgmid ?? "NaN")));
  return _.compact(idList);
}

export async function getAllBgmIdInBangumiDataTable() {
  const allBgmID = await db
    .select({
      bgmid: bangumiData.bgmid,
      update_time: bangumiData.update_time,
    })
    .from(bangumiData);

  const idList: number[] = [];
  allBgmID.forEach((value) => idList.push(value.bgmid));
  return _.compact(idList);
}

export async function insertBgmIDToDB(bgmID: number) {
  const isExist = await db
    .select({ bgmid: bangumiData.bgmid })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (isExist.length === 0) {
    await db.insert(bangumiData).values({ bgmid: bgmID });
    log.info("插入 bgm%d 到 Bangumi Data", bgmID);
    await updateBangumiData(bgmID, undefined);
  }
}

export async function insertBgmIDBlankToDB(bgmID: number) {
  const isExist = await db
    .select({ bgmid: bangumiData.bgmid })
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, bgmID))
    .limit(1);

  if (isExist.length === 0) {
    await db.insert(bangumiData).values({
      bgmid: bgmID,
      update_time: new Date(100000000),
    });
    log.info("插入Blank bgm%d 到 Bangumi Data", bgmID);
  }
}
