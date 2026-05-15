import _ from "lodash";
import { db } from "../../common/database/connection.js";
import { anime } from "../../common/database/schema/anime.js";
import { eq, and } from "drizzle-orm";
import { log } from "../../common/tools/logger.js";
import { getDefaultDrive, getDrive } from "../../services/v2/drive/index.js";
import alistGetter from "./tools/alistGetter.js";
import { repairBangumiDataID } from "./updateBangumiData.js";

interface NewAnimeEntry {
  year: string;
  type: string;
  name: string;
}

export default async function updateAnimes() {
  const allNewAnimes: NewAnimeEntry[] = [];
  const allDeletedAnimes: NewAnimeEntry[] = [];

  const drive = getDrive(getDefaultDrive())!;
  const drivePath = drive.path;

  const allYears = await getYears(drivePath);
  log.info("获取到 %d 个年份", allYears.length);

  for (const i in allYears) {
    const thisYear = allYears[i];
    const allTypes = await getTypes(drivePath, thisYear);

    for (const j in allTypes) {
      const thisType = allTypes[j];

      const allAnimes = await getAnimes(drivePath, thisYear, thisType);
      log.info("成功获取 %s %s", thisYear, thisType);
      const allDBAnimes = await getThisTypeDB(thisYear, thisType);

      const newAnimes = _.difference(allAnimes, allDBAnimes);

      for (const k in newAnimes) {
        const thisAnime = newAnimes[k];
        const isNew = await isNewInDB(thisYear, thisType, thisAnime);
        const isDeleted = await isDeletedInDB(thisYear, thisType, thisAnime);

        if (isNew && !isDeleted) {
          insertAnimeToDB(thisYear, thisType, thisAnime);
          log.info("新入库 %s %s %s", thisYear, thisType, thisAnime);
        }
        if (!isNew && isDeleted) {
          changeDelete(thisYear, thisType, thisAnime, false);
          log.info("移除删除标记 %s %s %s", thisYear, thisType, thisAnime);
        }
        allNewAnimes.push({ year: thisYear, type: thisType, name: thisAnime });
      }

      const deletedAnimes = _.difference(allDBAnimes, allAnimes);

      for (const k in deletedAnimes) {
        const thisAnime = deletedAnimes[k];
        changeDelete(thisYear, thisType, thisAnime, true);
        log.warn("发现番剧被删除! 增加删除标记 %s %s %s", thisYear, thisType, thisAnime);
        allDeletedAnimes.push({ year: thisYear, type: thisType, name: thisAnime });
      }
    }
  }
  await repairBangumiDataID();

  log.info("发现的 Alist 新番剧: %j", allNewAnimes);
  log.info("发现的 Alist 被删除的番剧: %j", allDeletedAnimes);
}

async function getYears(drivePath: string) {
  let rootDir = await alistGetter(drivePath);
  if (rootDir.code === 200) rootDir = rootDir.data.content;
  else throw new Error("Alist API 异常");

  const allYears: string[] = [];
  for (const i in rootDir) {
    if (rootDir[i].is_dir) allYears.push(rootDir[i].name);
  }

  return allYears;
}

async function getTypes(drivePath: string, year: string) {
  let yearDir = await alistGetter(`${drivePath}/${year}`);
  if (yearDir.code === 200) yearDir = yearDir.data.content;
  else throw new Error("Alist API 异常");

  const thisYearTypes: string[] = [];
  for (const i in yearDir) {
    if (yearDir[i].is_dir) thisYearTypes.push(yearDir[i].name);
  }

  return thisYearTypes;
}

async function getAnimes(drivePath: string, year: string, type: string) {
  let typeDir = await alistGetter(`${drivePath}/${year}/${type}`);
  if (typeDir.code === 200) typeDir = typeDir.data.content;
  else throw new Error("Alist API 异常");

  const thisTypeAnimes: string[] = [];
  for (const i in typeDir) {
    if (typeDir[i].is_dir) thisTypeAnimes.push(typeDir[i].name);
  }

  return thisTypeAnimes;
}

async function getThisTypeDB(year: string, type: string) {
  const rows = await db
    .select({ name: anime.name })
    .from(anime)
    .where(and(eq(anime.year, year), eq(anime.type, type), eq(anime.deleted, 0)));

  const allDBAnimes: string[] = [];
  rows.forEach((row) => allDBAnimes.push(row.name));

  return allDBAnimes;
}

async function isNewInDB(year: string, type: string, name: string) {
  const rows = await db
    .select()
    .from(anime)
    .where(and(eq(anime.year, year), eq(anime.type, type), eq(anime.name, name)))
    .limit(1);

  return rows.length === 0;
}

async function isDeletedInDB(year: string, type: string, name: string) {
  const rows = await db
    .select()
    .from(anime)
    .where(
      and(eq(anime.year, year), eq(anime.type, type), eq(anime.name, name), eq(anime.deleted, 1))
    )
    .limit(1);

  return rows.length !== 0;
}

function insertAnimeToDB(year: string, type: string, name: string) {
  const bgmID = name.match("\\d+")![0];
  const title = name.replace(bgmID, "").trim();
  return db.insert(anime).values({ year, type, name, bgmid: bgmID, title });
}

async function changeDelete(year: string, type: string, name: string, deleted: boolean) {
  if (!year || !type || !name) throw new Error("No anime provided");
  if (deleted === undefined || typeof deleted !== "boolean")
    throw new Error("No delete state provided");
  await db
    .update(anime)
    .set({ deleted: deleted ? 1 : 0 })
    .where(and(eq(anime.year, year), eq(anime.type, type), eq(anime.name, name)));
}
