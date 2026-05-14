import _ from "lodash";
import config from "../../../common/config.js";
import { db } from "../../../common/database/connection.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { inArray } from "drizzle-orm";
import { getAnimesByBgmID } from "../anime/index.js";

export async function parseAnime(rawData, full = false) {
  if (!rawData) throw new Error("No data provide");
  if (typeof rawData !== "object") throw new Error("Data is not a Object");

  rawData = _.castArray(rawData);
  rawData = _.compact(rawData);
  let bgmIDList = parseAllBgmID(rawData);
  let bgmData = await getAllBangumiData(bgmIDList);
  let parseResults = new Array();

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
  let bgmIDList = new Array();
  for (let i in data) {
    let thisBgmId = parseInt(data[i].bgmid);
    if (thisBgmId) bgmIDList.push(thisBgmId);
  }
  return bgmIDList;
}

async function getAllBangumiData(bgmIDList) {
  let bgmData = {};
  if (bgmIDList.length > 0) {
    let queryResult = await db
      .select()
      .from(bangumiData)
      .where(inArray(bangumiData.bgmid, bgmIDList));

    for (let i in queryResult) {
      for (let j in queryResult[i]) {
        if (typeof queryResult[i][j] == "string") {
          queryResult[i][j] = queryResult[i][j].replace(
            /https\:\/\/lain\.bgm\.tv/gi,
            config.bangumiImage.host
          );
        }
      }
      bgmData[queryResult[i].bgmid] = {
        relations: JSON.parse(queryResult[i].relations_anime),
        subjects: JSON.parse(queryResult[i].subjects),
        characters: JSON.parse(queryResult[i].characters),
      };
    }
  }
  return bgmData;
}

async function parseBangumiRelations(relations) {
  let parsedRelations = new Array();
  for (let i in relations) {
    let thisBgmIDAnimes = await getAnimesByBgmID(relations[i].id);
    for (let j in thisBgmIDAnimes) {
      parsedRelations.push({
        ...thisBgmIDAnimes[j],
        relation: relations[i].relation,
      });
    }
  }
  return parsedRelations;
}
