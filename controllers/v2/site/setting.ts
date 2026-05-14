import { getSiteSetting as getSiteSettingService, setSiteSetting as setSiteSettingService   } from "../../../services/v2/site/setting.js";
import success from "../../../common/response/success.js";
import notFound from "../../../common/response/not-found.js";
import serverError from "../../../common/response/server-error.js";

export async function getSiteSetting(req, res) {
  let key = req.query.key;

  try {
    let result = await getSiteSettingService(key);
    if (result !== null) {
      return success(res, result);
    } else {
      return notFound(res);
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}

export async function setSiteSetting(req, res) {
  let { key, value } = req.body;

  try {
    await setSiteSettingService(key, value);
    return success(res, undefined);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
