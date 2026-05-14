import { quickSearch as quickSearchService  } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";

export async function quickSearch(req, res) {
  let value = req.query.value;
  if (!value || typeof value !== "string") return badRequest(res);

  try {
    let searchResults = await quickSearchService(value);
    success(res, searchResults);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
