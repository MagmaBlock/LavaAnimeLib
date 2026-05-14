import { searchAnimes as searchAnimesService  } from "../../../services/v2/search/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";

export async function searchAnimes(req, res) {
  let value = req.query.value;

  try {
    let searchResults = await searchAnimesService(value);
    success(res, searchResults);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
