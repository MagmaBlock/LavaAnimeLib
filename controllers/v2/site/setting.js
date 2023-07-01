import { promiseDB } from "../../../common/sql.js";
import success from "../response/2xx/success.js";
import notFound from "../response/4xx/notFound.js";
import wrongQuery from "../response/4xx/wrongQuery.js";
import serverError from "../response/5xx/serverError.js";

// GET /v2/site/setting/get
// 获取站点某一配置
export async function getSiteSetting(req, res) {
  let key = req.query.key;
  if (!key) {
    return wrongQuery(res);
  }

  try {
    let queryResult = await promiseDB.execute(
      "SELECT * FROM settings WHERE `key` = ?",
      [key]
    );

    let result = queryResult[0][0];
    if (result !== undefined) {
      // 尝试解析 JSON
      try {
        return success(res, JSON.parse(result?.value));
      } catch (error) {
        // 如果此字符串无法解析, 直接回复字符串
        if (error instanceof SyntaxError) {
          return success(res, result?.value);
        } else {
          throw error;
        }
      }
    } else {
      return notFound(res);
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}

// POST /v2/site/setting/set
// 设定站点某一配置
export async function setSiteSetting(req, res) {
  let { key, value } = req.body;
  if (!key || typeof key != "string" || value === undefined || value === null)
    return wrongQuery(res);

  try {
    await promiseDB.query(
      "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [key, JSON.stringify(value), JSON.stringify(value)]
    );

    return success(res);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
