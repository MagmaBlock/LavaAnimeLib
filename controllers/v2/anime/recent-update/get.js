import parseFileName from "anime-file-parser";
import { prisma } from "../../../../prisma/client.js";
import { animeParser } from "../../parser/animeParser.js";
import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";

export async function getRecentUpdatesAPI(req, res) {
  let { skip = 0, take = 20 } = req.query;

  try {
    skip = Number.parseInt(skip);
    take = Number.parseInt(take);

    if (skip < 0 || take < 0) throw "";
  } catch (error) {
    return wrongQuery(res);
  }

  let recentUpdates = await prisma.upload_message.findMany({
    skip,
    take,
    include: { anime: true },
    orderBy: { uploadTime: "desc" },
  });

  for (let record of recentUpdates) {
    if (record.anime !== null)
      record.anime = (await animeParser(record.anime))[0];
    record.parseResult = parseFileName(record.fileName);
  }

  return success(res, recentUpdates);
}
