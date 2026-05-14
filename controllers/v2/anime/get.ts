import { getAnimeByID as getAnimeByIDService  } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";

export async function getAnimeByID(req, res) {
  let laID = req.query.id;
  if (!isFinite(laID)) return badRequest(res);
  let full = req.query.full || false;
  if (full) full = JSON.parse(req.query.full);

  try {
    let anime = await getAnimeByIDService(laID, full);
    if (anime.deleted) return notFound(res);

    success(res, anime);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
