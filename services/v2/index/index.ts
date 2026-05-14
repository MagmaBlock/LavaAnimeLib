import { promiseDB } from "../../../common/database/connection.js";

export async function getIndexInfo() {
  let indexData = {
    year: [],
    type: [],
  };

  let allYearQueryResult = await promiseDB.query(
    "SELECT DISTINCT `year` FROM anime ORDER BY `year`"
  );
  let allTypeQueryResult = await promiseDB.query(
    "SELECT DISTINCT `type` FROM anime"
  );
  for (let i in allYearQueryResult[0]) {
    indexData.year.push(allYearQueryResult[0][i].year);
  }
  for (let i in allTypeQueryResult[0]) {
    indexData.type.push(allTypeQueryResult[0][i].type);
  }

  indexData.type = indexData.type.sort().sort((a, b) => {
    return a.match(/\d{1,2}|./)[0] - b.match(/\d{1,2}|./)[0]; // 匹配1-2位数字，如果没有，则按第一个字符
  });

  return indexData;
}

export async function queryAnimeByIndex(year, type) {
  let queryPlaceholder = [year || "%", type || "%"];

  let queryResult = await promiseDB.query(
    "SELECT * FROM anime WHERE year LIKE ? AND `type` LIKE ? AND deleted = 0 ORDER BY views DESC",
    queryPlaceholder
  );

  return queryResult[0];
}
