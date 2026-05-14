import { queryAnimeByIndex as queryAnimeByIndexService  } from "../../../services/v2/index/index.js";
import { parseAnime } from "../../../services/v2/parser/anime.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";
import badRequest from "../../../common/response/bad-request.js";

export default async function queryAnimeByIndex(req, res) {
  if (Object.keys(req.body).length == 0) return badRequest(res);

  let { year, type } = req.body;
  if (!year && !type) return badRequest(res);

  try {
    let rawResults = await queryAnimeByIndexService(year, type);
    let result = await parseAnime(rawResults);
    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
