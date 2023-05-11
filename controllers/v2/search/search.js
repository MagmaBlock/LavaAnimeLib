import _ from "lodash";
import { promiseDB } from "../../../common/sql.js";
import { animeParser } from "../parser/animeParser.js";

export async function searchAnimes(value) {
  let splitedValue = value.split(" ");
  let query = "SELECT * FROM anime WHERE ";
  for (let i in splitedValue) {
    splitedValue[i] = splitedValue[i].replace("%", "\\%");
    splitedValue[i] = splitedValue[i].replace("_", "\\_");
    splitedValue[i] = "%" + splitedValue[i] + "%";
    query = query + `title LIKE ? AND `;
  }
  query = query + "deleted = 0 ORDER BY views DESC";

  let searchResults = await promiseDB.query(query, splitedValue);
  searchResults = await animeParser(searchResults[0]);

  return searchResults;
}

export async function quickSearch(value) {
  if (!value) return [];
  let queryResults = await promiseDB.query(
    "SELECT title FROM anime WHERE title LIKE ? AND deleted = 0 ORDER BY views DESC",
    [`%${value}%`]
  );
  queryResults = queryResults[0];
  let quickSearch = [];
  // 优先展示以当前搜索词开头的 title
  for (let i in queryResults) {
    let thisTitle = queryResults[i].title;
    if (thisTitle.startsWith(value)) quickSearch.push(queryResults[i].title);
  }
  // 靠后展示包含当前搜索词的 title
  for (let i in queryResults) {
    let thisTitle = queryResults[i].title;
    if (!thisTitle.startsWith(value)) quickSearch.push(queryResults[i].title);
  }
  // 删除过多的数据 (如果有)
  for (let i in quickSearch) {
    if (i >= 10) quickSearch[i] = "";
  }
  quickSearch = _.compact(quickSearch);
  return quickSearch;
}
