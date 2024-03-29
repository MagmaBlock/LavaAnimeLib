import _ from "lodash";
import config from "../../../common/config.js";
import { promiseDB } from "../../../common/sql.js";
import { getAnimesByBgmID } from "../anime/get.js";

export async function animeParser(rawData, full = false) {
  /*
        传入 anime 表查询结果的数组，自动解析为比较完美的数据结构
        注意，返回的数据始终为数组
    */
  if (!rawData) throw new Error("No data provide");
  if (typeof rawData !== "object") throw new Error("Data is not a Object");

  rawData = _.castArray(rawData); // 强制转为数组
  rawData = _.compact(rawData);
  let bgmIDList = parseAllBgmID(rawData); // 获取 rawData 里面的所有 bgmID
  let bgmData = await getAllBangumiData(bgmIDList); // 拿到 bgmID 和 BangumiData 的键值对
  let parseResults = new Array(); // 存储结果

  for (let i in rawData) {
    parseResults.push(await parseSingleAnimeData(rawData[i], bgmData, full));
  }

  return parseResults;
}

async function parseSingleAnimeData(rawData, bgmData, full = false) {
  if (parseInt(rawData.bgmid)) {
    let thisbgmData = bgmData[rawData.bgmid];

    let thisAnimeData = {
      id: parseInt(rawData.id),
      bgmID: parseInt(rawData.bgmid),
      index: {
        year: rawData.year,
        type: rawData.type,
        name: rawData.name,
      },
      views: rawData.views,
      title: rawData.title.replace(/\[BDRip\]|\[NSFW\]/gi, ""),
      type: {
        bdrip: rawData.title.match(/\[BDRip\]/i) ? true : false,
        nsfw: rawData.title.match(/\[NSFW\]/i) ? true : false,
      },
      images: {
        ...thisbgmData.subjects.images,
        poster: thisbgmData.subjects.images.large + "/poster",
      },
      deleted: false,
    };
    if (full) {
      // 遍历每个 BgmData 解析其中的 relations，将 realations 变成比较好阅读的番剧库格式
      let newRelations = await parseBangumiRelations(thisbgmData.relations);
      thisAnimeData = {
        ...thisbgmData.subjects,
        ...thisAnimeData,
        relations: newRelations,
        characters: thisbgmData.characters,
      };
    }
    return thisAnimeData;
  }
  if (!parseInt(rawData.bgmid)) {
    // 非 Bangumi 番剧
    let thisAnimeData = {
      id: parseInt(rawData.id),
      index: {
        year: rawData.year,
        type: rawData.type,
        name: rawData.name,
      },
      views: rawData.views,
      title: rawData.title.replace(/\[BDRip\]|\[NSFW\]/gi, ""),
      type: {
        bdrip: rawData.title.match(/\[BDRip\]/i) ? true : false,
        nsfw: rawData.title.match(/\[NSFW\]/i) ? true : false,
      },
      images: {
        small: rawData.poster,
        grid: rawData.poster,
        large: rawData.poster,
        medium: rawData.poster,
        common: rawData.poster,
        poster: rawData.poster,
      },
      deleted: false,
    };

    return thisAnimeData;
  }
}

function parseAllBgmID(data) {
  // 将从数据库的原始数据传入，返回 bgmID 所对应的 subject 数据键值对
  let bgmIDList = new Array(); // 本次传入的 bgmID 列表
  for (let i in data) {
    let thisBgmId = parseInt(data[i].bgmid);
    if (thisBgmId) bgmIDList.push(thisBgmId);
  }
  return bgmIDList;
}

async function getAllBangumiData(bgmIDList) {
  // 查询上方收集的 Bangumi 对应的数据
  let bgmData = {}; // 存储 Bangumi 数据的对象，使用 BgmID 为 Key 就能拿到
  if (bgmIDList.length > 0) {
    let queryResult = await promiseDB.query(
      "SELECT * FROM bangumi_data WHERE bgmid IN (?)",
      [bgmIDList]
    );
    let queryBgmData = queryResult[0];

    for (let i in queryBgmData) {
      // 遍历每个来自数据库的 bgmData
      for (let j in queryBgmData[i]) {
        // 遍历对象的每个元素
        if (typeof queryBgmData[i][j] == "string") {
          // 如果是字符串，替换 CDN 链接
          queryBgmData[i][j] = queryBgmData[i][j].replace(
            /https\:\/\/lain\.bgm\.tv/gi,
            config.bangumiImage.host
          );
          // console.log(queryBgmData[i][j] + '\n\n');
        }
      }
      bgmData[queryBgmData[i].bgmid] = {
        relations: JSON.parse(queryBgmData[i].relations_anime),
        subjects: JSON.parse(queryBgmData[i].subjects),
        characters: JSON.parse(queryBgmData[i].characters),
      };
    }
  }
  return bgmData;
}

async function parseBangumiRelations(relations) {
  // 传入数组形式的 relations，将其解析成番剧库格式
  let parsedRelations = new Array(); // 结果
  for (let i in relations) {
    // 遍历的是某个 bgmID
    let thisBgmIDAnimes = await getAnimesByBgmID(relations[i].id); // 获取的是此 bgmID 的番剧，!可能会有多个!
    for (let j in thisBgmIDAnimes) {
      // 解析出的结果可能会有多个相同 bgmID 的动画，每个都需要与 relation 合并
      parsedRelations.push({
        ...thisBgmIDAnimes[j],
        relation: relations[i].relation,
      });
    }
  }
  return parsedRelations;
}
