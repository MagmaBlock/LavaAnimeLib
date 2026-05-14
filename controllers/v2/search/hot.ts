import { getHotAnimes as getHotAnimesService  } from "../../../services/v2/search/hot.js";
import success from "../../../common/response/success.js";

export async function getHotAnimes(req, res) {
  let result = await getHotAnimesService();
  success(res, result);
}
