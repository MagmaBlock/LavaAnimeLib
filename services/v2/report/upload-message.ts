import path from "path";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { bangumiData } from "../../../common/database/schema/bangumi-data.js";
import { uploadMessage } from "../../../common/database/schema/upload-message.js";
import { eq, and, sql } from "drizzle-orm";

export async function reportUploadMessage(index, fileName) {
  let filePath = path.normalize(index).split(/\\|\//);
  let trueIndex = filePath.slice(-3);

  const animeRows = await db
    .select()
    .from(anime)
    .where(
      and(
        eq(anime.year, trueIndex[0]),
        eq(anime.type, trueIndex[1]),
        eq(anime.name, trueIndex[2])
      )
    )
    .limit(1);
  let possibleAnime = animeRows[0] || null;

  let bangumiID: string | number | null =
    trueIndex.slice(-1)[0].match(/(?<= )\d{1,6}$/)?.[0] ?? null;
  let parseBangumiID = Number.parseInt(String(bangumiID));
  if (!isNaN(parseBangumiID)) {
    bangumiID = parseBangumiID;
  }

  const bgmRows = await db
    .select()
    .from(bangumiData)
    .where(eq(bangumiData.bgmid, Number(bangumiID)));
  let bgmData = bgmRows[0] || null;

  if (bgmData === null) {
    bangumiID = null;
  }

  await db.insert(uploadMessage).values({
    index: trueIndex.join("/"),
    animeID: possibleAnime?.id ?? null,
    bangumiID: bangumiID as number | null,
    fileName,
  });

  return true;
}
