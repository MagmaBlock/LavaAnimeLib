import { getAnimesByBgmID as getAnimesByBgmIDService  } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";

export async function getAnimesByBgmID(req, res) {
  let bgmID = req.query.bgmid;

  try {
    let result = await getAnimesByBgmIDService(bgmID);
    return success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
