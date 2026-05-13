import path from "path";
import { promiseDB } from "../../../common/sql.js";
import success from "../response/2xx/success.js";
import wrongQuery from "../response/4xx/wrongQuery.js";

/**
 * 此 API 接收下载机的更新上报，并记录到最近更新列表。
 */
export async function reportUploadMessageAPI(req, res) {
  let { index, fileName } = req.body;

  if (typeof index != "string" || typeof fileName != "string")
    return wrongQuery(res);

  // 分割文件路径, 取出最后三层
  let filePath = path.normalize(index).split(/\\|\//);
  let trueIndex = filePath.slice(-3);

  // 尝试获取此动画信息，当然 有可能是未入库的新动画，此项可能为 null
  const [animeRows] = await promiseDB.query(
    "SELECT * FROM anime WHERE year = ? AND type = ? AND name = ? LIMIT 1",
    [trueIndex[0], trueIndex[1], trueIndex[2]]
  );
  let possibleAnime = animeRows[0] || null;

  let bangumiID: number | string | null =
    trueIndex.slice(-1)[0].match(/(?<= )\d{1,6}$/)?.[0] ?? null;
  let parseBangumiID = Number.parseInt(bangumiID ?? "");
  if (!isNaN(parseBangumiID)) {
    bangumiID = parseBangumiID;
  }

  // 先检查是否存在此 bgmID 的 BangumiData, 如果不存在，不关联，否则将导致外键错误
  const [bgmRows] = await promiseDB.query(
    "SELECT * FROM bangumi_data WHERE bgmid = ?",
    [bangumiID]
  );
  let bgmData = bgmRows[0] || null;

  if (bgmData === null) {
    bangumiID = null;
  }

  await promiseDB.query(
    "INSERT INTO upload_message (`index`, animeID, bangumiID, fileName) VALUES (?, ?, ?, ?)",
    [trueIndex.join("/"), possibleAnime?.id ?? null, bangumiID, fileName]
  );

  success(res, undefined);
}
