import { getRecentUpdates as getRecentUpdatesService  } from "../../../../services/v2/anime/recent-update.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function getRecentUpdates(req, res) {
  let { skip, take, ignoreDuplicate } = req.query;

  try {
    let result = await getRecentUpdatesService(skip, take, ignoreDuplicate);
    return success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
