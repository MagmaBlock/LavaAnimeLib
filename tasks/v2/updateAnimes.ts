import _ from "lodash";
import { db } from "../../common/database/connection.js";
import { anime } from "../../common/database/schema/anime.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../../common/tools/logger.js";
import { getDefaultDrive, getDrive } from "../../services/v2/drive/index.js";
import alistGetter from "./tools/alistGetter.js";
import { repairBangumiDataID } from "./updateBangumiData.js";

export default async function updateAnimes() {
  let allNewAnimes = new Array();
  let allDeletedAnimes = new Array();

  let allYears = await getYears();
  logger(`[番剧更新] 获取到 ${allYears.length} 个年份`);

  for (let i in allYears) {
    let thisYear = allYears[i];
    let allTypes = await getTypes(thisYear);

    for (let j in allTypes) {
      let thisType = allTypes[j];

      let allAnimes = await getAnimes(thisYear, thisType);
      logger(`[番剧更新] 成功获取 ${thisYear} ${thisType}`);
      let allDBAnimes = await getThisTypeDB(thisYear, thisType);

      let newAnimes = _.difference(allAnimes, allDBAnimes);

      for (let k in newAnimes) {
        let thisAnime = newAnimes[k];
        let isNew = await isNewInDB(thisYear, thisType, thisAnime);
        let isDeleted = await isDeletedInDB(thisYear, thisType, thisAnime);

        if (isNew && !isDeleted) {
          insertAnimeToDB(thisYear, thisType, thisAnime);
          logger(`[番剧更新] 新入库 ${thisYear} ${thisType} ${thisAnime}`);
        }
        if (!isNew && isDeleted) {
          changeDelete(thisYear, thisType, thisAnime, false);
          logger(`[番剧更新] 移除删除标记 ${thisYear} ${thisType} ${thisAnime}`);
        }
        allNewAnimes.push({ year: thisYear, type: thisType, name: thisAnime });
      }

      let deletedAnimes = _.difference(allDBAnimes, allAnimes);

      for (let k in deletedAnimes) {
        let thisAnime = deletedAnimes[k];
        changeDelete(thisYear, thisType, thisAnime, true);
        logger(
          `[番剧更新] 发现番剧被删除! 增加删除标记 ${
            `${thisYear} ${thisType} ${thisAnime}`
          }`
        );
        allDeletedAnimes.push({
          year: thisYear,
          type: thisType,
          name: thisAnime,
        });
      }
    }
  }
  await repairBangumiDataID();

  logger("[番剧更新] 发现的 Alist 新番剧: ", allNewAnimes);
  logger("[番剧更新] 发现的 Alist 被删除的番剧: ", allDeletedAnimes);
}

async function getYears() {
  let rootDir = await alistGetter();
  if (rootDir.code == 200) rootDir = rootDir.data.content;
  else throw new Error("Alist API 异常");

  let allYears = new Array();
  for (let i in rootDir) {
    if (rootDir[i].is_dir == true) allYears.push(rootDir[i].name);
  }

  return allYears;
}

async function getTypes(year) {
  let yearDir = await alistGetter(
    getDrive(getDefaultDrive()).path + "/" + year
  );
  if (yearDir.code == 200) yearDir = yearDir.data.content;
  else throw new Error("Alist API 异常");

  let thisYearTypes = new Array();
  for (let i in yearDir) {
    if (yearDir[i].is_dir == true) thisYearTypes.push(yearDir[i].name);
  }

  return thisYearTypes;
}

async function getAnimes(year, type) {
  let typeDir = await alistGetter(
    getDrive(getDefaultDrive()).path + "/" + year + "/" + type
  );
  if (typeDir.code == 200) typeDir = typeDir.data.content;
  else throw new Error("Alist API 异常");

  let thisTypeAnimes = new Array();
  for (let i in typeDir) {
    if (typeDir[i].is_dir == true) thisTypeAnimes.push(typeDir[i].name);
  }

  return thisTypeAnimes;
}

async function getThisTypeDB(year, type) {
  let rows = await db
    .select({ name: anime.name })
    .from(anime)
    .where(
      and(eq(anime.year, year), eq(anime.type, type), eq(anime.deleted, 0))
    );

  let allDBAnimes = new Array();
  rows.forEach((row) => allDBAnimes.push(row.name));

  return allDBAnimes;
}

async function isNewInDB(year, type, name) {
  let rows = await db
    .select()
    .from(anime)
    .where(and(eq(anime.year, year), eq(anime.type, type), eq(anime.name, name)))
    .limit(1);

  if (rows.length == 0) return true;
  return false;
}

async function isDeletedInDB(year, type, name) {
  let rows = await db
    .select()
    .from(anime)
    .where(
      and(
        eq(anime.year, year),
        eq(anime.type, type),
        eq(anime.name, name),
        eq(anime.deleted, 1)
      )
    )
    .limit(1);

  if (rows.length !== 0) return true;
  return false;
}

async function insertAnimeToDB(year, type, name) {
  let bgmID = name.match("\\d+")[0];
  let title = name.replace(bgmID, "").trim();
  await db.insert(anime).values({
    year,
    type,
    name,
    bgmid: bgmID,
    title,
  });
}

async function changeDelete(year, type, name, deleted) {
  if (!year || !type || !name) throw new Error("No anime provided");
  if (deleted === undefined || typeof deleted !== "boolean")
    throw new Error("No delete state provided");
  await db
    .update(anime)
    .set({ deleted: deleted ? 1 : 0 })
    .where(
      and(eq(anime.year, year), eq(anime.type, type), eq(anime.name, name))
    );
}
