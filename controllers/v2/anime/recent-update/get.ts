import { getRecentUpdates as getRecentUpdatesService  } from "../../../../services/v2/anime/recent-update.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";

export async function getRecentUpdates(req, res) {
  let { skip = 0, take = 20, ignoreDuplicate = true } = req.query;

  try {
    skip = Number.parseInt(skip);
    take = Number.parseInt(take);
    ignoreDuplicate = JSON.parse(ignoreDuplicate);

    if (skip < 0 || take < 0 || typeof ignoreDuplicate !== "boolean") throw "";
  } catch (error) {
    return badRequest(res);
  }

  let result = await getRecentUpdatesService(skip, take, ignoreDuplicate);
  return success(res, result);
}
