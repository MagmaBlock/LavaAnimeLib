import _ from "lodash";
import { promiseDB } from "../../common/sql.js";
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

let reTry = {};

export async function updateAllBangumiData() {
  // 根据缓存情况更新全部库内数据

  await repairBangumiDataID();
  let bgmIDListExpired = await findExpiredBangumiData(); // 查找过期
  let bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable(); // Anime 表的 BgmID 用于查找关联番剧
  let chunkedbgmIDList = _.chunk(bgmIDListExpired, 9); // 把大数组拆成含有 n 个对象的小数组
  console.log(
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
    await Promise.all(task); // 等待 task 中的任务全部 resolve
  }
  console.log("[Bangumi Data] Bangumi Data 刷新完成");
}

export async function repairBangumiDataID() {
  // 对比 anime 和 bangumi_data 表的差异后自动修复表的函数

  let bgmIdInAnime = await getAllBgmIDInAnimeTable(); // Anime 表的 BgmID 用于查找关联番剧
  let bgmIDInData = await getAllBgmIdInBangumiDataTable(); // Bangumi Data 表的 BgmID 用于查找缺漏
  let diff = _.difference(bgmIdInAnime, bgmIDInData);

  console.log(`[Bangumi Data] 修复缺失 BgmID: ${diff}`);
  for (let i in diff) await insertBgmIDBlankToDB(diff[i]); // 会自动新建并填入数据
}

export async function updateBangumiData(bgmID, bgmIDListInAnimeTable) {
  // 直接更新给定的 Bangumi ID 的数据库数据.  bgmIDListInAnimeTable 可选

  if (!bgmID) throw new Error("No Bangumi ID provided!");
  if (!bgmIDListInAnimeTable)
    bgmIDListInAnimeTable = await getAllBgmIDInAnimeTable();

  let thisSubject = {};
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

  await promiseDB.query(
    "UPDATE bangumi_data SET subjects = ?, relations_anime = ?, characters = ?, update_time = ? WHERE bgmid = ?",
    [
      JSON.stringify(thisSubject.subject),
      JSON.stringify(thisSubject.relations),
      JSON.stringify(thisSubject.characters),
      new Date(),
      bgmID,
    ]
  );
  console.log(`[Bangumi Data] 成功刷新 bgm${bgmID}`);
  reTry[bgmID] = 0;
}

// 错误处理
async function errorHanding(error, bgmID, bgmIDListInAnimeTable) {
  if (error.response) {
    // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
    console.log(error.response.data);
    console.log(error.response.status);
  } else if (error.request || error.response) {
    // 请求已经成功发起，但没有收到响应
    if (reTry[bgmID] < 5 || !reTry[bgmID]) {
      reTry[bgmID] = reTry[bgmID] + 1 || 0;
      console.log(
        `[Bangumi Data] bgm${bgmID} 抓取出错，准备重试 (${reTry[bgmID]})`
      );
      setTimeout(() => {
        updateBangumiData(bgmID, bgmIDListInAnimeTable);
      }, 1000);
    } else {
      console.error(error);
      console.log(
        `[Bangumi Data] bgm${bgmID} 抓取出错超限, 已放弃. 以上为出错的内容`
      );
    }
  }
}
