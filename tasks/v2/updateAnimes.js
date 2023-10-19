import _ from "lodash";
import { promiseDB } from "../../common/sql.js";
import { logger } from "../../common/tools/logger.js";
import { getDefaultDrive, getDrive } from "../../controllers/v2/drive/main.js";
import { sendMiraiMessageToAll } from "../../common/miraiAPI.js";
import alistGetter from "./tools/alistGetter.js";
import { repairBangumiDataID } from "./updateBangumiData.js";

export default async function updateAnimes() {
  // 用于存储本次入库和删除的的番剧列表
  let allNewAnimes = new Array();
  let allDeletedAnimes = new Array();
  // 获取年列表
  let allYears = await getYears();
  logger(`[番剧更新] 获取到 ${allYears.length} 个年份`);

  // 获取每个年下的分类
  for (let i in allYears) {
    let thisYear = allYears[i];
    let allTypes = await getTypes(thisYear);

    // 获取每个分类下的番剧
    for (let j in allTypes) {
      let thisType = allTypes[j];

      let allAnimes = await getAnimes(thisYear, thisType); // Alist
      logger(`[番剧更新] 成功获取 ${thisYear} ${thisType}`);
      let allDBAnimes = await getThisTypeDB(thisYear, thisType); // DB deleted = 0

      // 查找 Alist 多出来的番剧 -----------------------------------------------------
      let newAnimes = _.difference(allAnimes, allDBAnimes); // 获取左边数组比右边数组多出的部分，即找 Alist 新增

      for (let k in newAnimes) {
        let thisAnime = newAnimes[k];
        let isNew = await isNewInDB(thisYear, thisType, thisAnime);
        let isDeleted = await isDeletedInDB(thisYear, thisType, thisAnime);

        if ((isNew, !isDeleted)) {
          // 如果是新资源 (并未在 DB 中 deleted)
          insertAnimeToDB(thisYear, thisType, thisAnime);
          logger(`[番剧更新] 新入库 ${(thisYear, thisType, thisAnime)}`);
        }
        if ((!isNew, isDeleted)) {
          // 被删除的资源 (在 DB 中被 deleted)
          changeDelete(thisYear, thisType, thisAnime, false);
          logger(`[番剧更新] 移除删除标记 ${(thisYear, thisType, thisAnime)}`);
        }
        allNewAnimes.push({ year: thisYear, type: thisType, name: thisAnime }); // 新增番剧加入本次刷新新增记录
      }

      // 查找数据库多出来的番剧 (Alist 删除的番剧) -------------------------------------
      let deletedAnimes = _.difference(allDBAnimes, allAnimes);

      for (let k in deletedAnimes) {
        let thisAnime = deletedAnimes[k];
        changeDelete(thisYear, thisType, thisAnime, true);
        logger(
          `[番剧更新] 发现番剧被删除! 增加删除标记 ${
            (thisYear, thisType, thisAnime)
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

  if (allNewAnimes.length) {
    let message = createMessage(allNewAnimes);
    let result = sendMiraiMessageToAll(message);
    logger("[番剧更新] 发送了 QQ 群消息.");
    logger(message);
    logger("结果:", result);
  }
}

async function getYears() {
  // Alist 获取所有年份

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
  // Alist 获取年份下的月份

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
  // Alist 获取指定分类的动画列表

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
  // 从数据库查询此分类有什么番剧

  let thisTypeAnimes = await promiseDB.query(
    "SELECT name FROM anime WHERE `year` LIKE ? AND `type` LIKE ? AND deleted = '0'",
    [year, type]
  );
  let allDBAnimes = new Array();
  thisTypeAnimes[0].forEach((anime) => allDBAnimes.push(anime.name));

  return allDBAnimes;
}

async function isNewInDB(year, type, name) {
  // 从数据库查询此番剧是否已经存在

  let isNew = await promiseDB.query(
    "SELECT * FROM anime WHERE `year` LIKE ? AND `type` LIKE ? AND `name` LIKE ?",
    [year, type, name]
  );
  isNew = isNew[0];
  if (isNew.length == 0) return true; // 如果数据库内找不到此动画为真
  if (isNew.length !== 0) return false; // 如果找到此动画为假（也可能是在数据库中被标记为 deleted 的资源）
}

async function isDeletedInDB(year, type, name) {
  // 从数据库查询此番剧是否被标记为删除

  let isDeleted = await promiseDB.query(
    "SELECT * FROM anime WHERE `year` LIKE ? AND `type` LIKE ? AND `name` LIKE ? AND deleted = 1",
    [year, type, name]
  );
  isDeleted = isDeleted[0];
  if (isDeleted.length !== 0) return true; // 如果数据库找到被删除的此动画为真
  if (isDeleted.length == 0) return false; // 如果数据库找不到已经被删除的此动画为假
}

async function insertAnimeToDB(year, type, name) {
  // 插入番剧到数据库

  let bgmID = name.match("\\d+$")[0];
  let title = name.replace(bgmID, "").trim();
  promiseDB.query(
    "INSERT INTO anime (`year`, `type`, `name`, `bgmid`, `title`) VALUES (?, ?, ?, ?, ?)",
    [year, type, name, bgmID, title]
  );
}

async function changeDelete(year, type, name, deleted) {
  // 修改数据库中指定年分类名称的番剧的删除状态

  if (!year || !type || !name) throw new Error("No anime provided");
  if (deleted === undefined || typeof deleted !== "boolean")
    throw new Error("No delete state provided");
  promiseDB.query(
    "UPDATE anime SET deleted = ? WHERE `year` = ? AND `type` = ? AND `name` = ?",
    [deleted, year, type, name]
  );
}

function createMessage(allNewAnimes) {
  // 传入新入库番剧列表，返回消息
  let message = [
    {
      type: "Plain",
      text: "【发现新作品收录 / 计划】(自动发送)\n",
    },
    {
      type: "Plain",
      text: "——————\n",
    },
  ];

  allNewAnimes.forEach((anime) => {
    message.push({
      type: "Plain",
      text: `${anime.year}${anime.type} - ${anime.name}\n`,
    });
  });

  message.push(
    {
      type: "Plain",
      text: "——————\n",
    },
    {
      type: "Plain",
      text: `新收录 / 计划以上 ${allNewAnimes.length} 部作品\n`,
    }
  );

  return message;
}
