import config from "../../common/config.js";
import { db } from "../../common/database/connection.js";
import { anime } from "../../common/database/schema/anime.js";
import { bangumiData } from "../../common/database/schema/bangumi-data.js";
import { eq, inArray } from "drizzle-orm";
import { getAllBgmIDInAnimeTable } from "./bangumiDB.js";
import { logger } from "../../common/tools/logger.js";

export async function updatePosters() {
  const allBgmIDInAnime = await getAllBgmIDInAnimeTable();
  const dbResult = await db
    .select({
      bgmid: bangumiData.bgmid,
      subjects: bangumiData.subjects,
    })
    .from(bangumiData)
    .where(inArray(bangumiData.bgmid, allBgmIDInAnime));

  const subjectsByBgmId: Record<string, Record<string, unknown>> = {};
  for (const row of dbResult) {
    subjectsByBgmId[row.bgmid] = JSON.parse(row.subjects!);
  }

  for (const bgmId of allBgmIDInAnime) {
    try {
      const subject = subjectsByBgmId[bgmId];
      if (subject?.images) {
        const images = subject.images as Record<string, string>;
        const thisPoster =
          images.large.replace("https://lain.bgm.tv", config.bangumiImage.host) + "/poster";
        await db
          .update(anime)
          .set({ poster: thisPoster })
          .where(eq(anime.bgmid, String(bgmId)));
      } else {
        await db
          .update(anime)
          .set({ poster: "https://anime-img.5t5.top/assets/noposter.png" })
          .where(eq(anime.bgmid, String(bgmId)));
      }
    } catch (error) {
      logger("[Poster 更新] 出错:", error);
    }
  }
}
