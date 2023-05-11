import { promiseDB } from "../../../common/sql.js";
import serverError from "../response/5xx/serverError.js";
import wrongQuery from "../response/4xx/wrongQuery.js";

import { animeParser } from "../parser/animeParser.js";
import success from "../response/2xx/success.js";

export default async function queryAnimeByIndex(req, res) {
  if (Object.keys(req.body).length == 0) return wrongQuery(res);

  let queryPlaceholder = [req.body.year || "%", req.body.type || "%"];

  let allEmpty = true;
  for (let i in queryPlaceholder) {
    if (queryPlaceholder[i] !== "%") allEmpty = false;
  }
  if (allEmpty) return wrongQuery(res);

  try {
    let queryResult = await promiseDB.query(
      "SELECT * FROM anime WHERE year LIKE ? AND `type` LIKE ? AND deleted = 0 ORDER BY views DESC",
      queryPlaceholder
    );
    let result = await animeParser(queryResult[0]);

    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
