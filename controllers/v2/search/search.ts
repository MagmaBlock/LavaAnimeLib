import { searchAnimes as searchAnimesService  } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";

export async function searchAnimes(req, res) {
  let value = req.query.value;
  if (!value || typeof value !== "string") return badRequest(res);

  try {
    let searchResults = await searchAnimesService(value);
    success(res, searchResults);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
