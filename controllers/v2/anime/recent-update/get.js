import parseFileName from "anime-file-parser";
import { promiseDB } from "../../../../common/sql.js";
import { animeParser } from "../../parser/animeParser.js";
import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";

export async function getRecentUpdatesAPI(req, res) {
  let { skip = 0, take = 20, ignoreDuplicate = true } = req.query;

  try {
    skip = Number.parseInt(skip);
    take = Number.parseInt(take);
    ignoreDuplicate = JSON.parse(ignoreDuplicate);

    if (skip < 0 || take < 0 || typeof ignoreDuplicate !== "boolean") throw "";
  } catch (error) {
    return wrongQuery(res);
  }

  let whereClause = "";
  let params = [];

  if (ignoreDuplicate) {
    // messageSkiped 是旧通知队列留下的字段；当前仅兼容历史数据的重复过滤。
    whereClause = "WHERE um.messageSkiped = false";
  }

  const [rows] = await promiseDB.query(
    `SELECT um.*, a.id AS a_id, a.year AS a_year, a.type AS a_type, a.name AS a_name, a.views AS a_views, a.bgmid AS a_bgmid, a.nsfw AS a_nsfw, a.title AS a_title, a.deleted AS a_deleted, a.poster AS a_poster
     FROM upload_message um
     LEFT JOIN anime a ON um.animeID = a.id
     ${whereClause}
     ORDER BY um.uploadTime DESC
     LIMIT ?, ?`,
    [...params, skip, take]
  );

  let recentUpdates = rows.map((row) => {
    let record = {
      id: row.id,
      index: row.index,
      animeID: row.animeID,
      bangumiID: row.bangumiID,
      fileName: row.fileName,
      messageSentStatus: row.messageSentStatus,
      messageSkiped: row.messageSkiped,
      uploadTime: row.uploadTime,
      anime: row.a_id
        ? {
            id: row.a_id,
            year: row.a_year,
            type: row.a_type,
            name: row.a_name,
            views: row.a_views,
            bgmid: row.a_bgmid,
            nsfw: row.a_nsfw,
            title: row.a_title,
            deleted: row.a_deleted,
            poster: row.a_poster,
          }
        : null,
    };
    return record;
  });

  for (let record of recentUpdates) {
    if (record.anime !== null)
      record.anime = (await animeParser(record.anime))[0];
    record.parseResult = parseFileName(record.fileName);
  }

  return success(res, recentUpdates);
}
