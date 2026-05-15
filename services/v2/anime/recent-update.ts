import parseFileName from "anime-file-parser";
import { db } from "../../../common/database/connection.js";
import { uploadMessage } from "../../../common/database/schema/upload-message.js";
import { anime } from "../../../common/database/schema/anime.js";
import { eq, desc } from "drizzle-orm";
import { parseAnime, type RawAnimeRow } from "../parser/anime.js";

interface RecentUpdateRecord {
  id: number;
  index: string;
  animeID: number | null;
  bangumiID: number | null;
  fileName: string | null;
  parseResult: ReturnType<typeof parseFileName>;
  messageSentStatus: number;
  messageSkiped: number;
  uploadTime: Date;
  anime: Record<string, unknown> | null;
}

export async function getRecentUpdates(
  skip: number,
  take: number,
  ignoreDuplicate?: boolean
): Promise<RecentUpdateRecord[]> {
  let conditions = undefined;

  if (ignoreDuplicate) {
    conditions = eq(uploadMessage.messageSkiped, 0);
  }

  const rows = await db
    .select()
    .from(uploadMessage)
    .leftJoin(anime, eq(uploadMessage.animeID, anime.id))
    .where(conditions)
    .orderBy(desc(uploadMessage.uploadTime))
    .limit(take)
    .offset(skip);

  const recentUpdates: RecentUpdateRecord[] = rows.map((row) => {
    const um = row.upload_message;
    const a = row.anime;
    return {
      id: um.id,
      index: um.index,
      animeID: um.animeID,
      bangumiID: um.bangumiID,
      fileName: um.fileName,
      parseResult: parseFileName(um.fileName!),
      messageSentStatus: um.messageSentStatus,
      messageSkiped: um.messageSkiped,
      uploadTime: um.uploadTime!,
      anime: a
        ? {
            id: a.id,
            year: a.year,
            type: a.type,
            name: a.name,
            views: a.views,
            bgmid: a.bgmid,
            nsfw: a.nsfw,
            title: a.title,
            deleted: a.deleted,
            poster: a.poster,
          }
        : null,
    };
  });

  for (const record of recentUpdates) {
    if (record.anime !== null)
      record.anime = (await parseAnime(record.anime as unknown as RawAnimeRow))[0];
  }

  return recentUpdates;
}
