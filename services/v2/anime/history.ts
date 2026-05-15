import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { viewHistory } from "../../../common/database/schema/view-history.js";
import { eq, and, sql, count, desc } from "drizzle-orm";
import parseFileName from "anime-file-parser";
import { logger } from "../../../common/tools/logger.js";

export async function recordViewHistory(
  userID: number,
  animeID: number,
  fileName: string,
  currentTime: number | undefined,
  totalTime: number | undefined,
  userIP: string,
  watchMethod: string,
  useDrive: string
): Promise<void> {
  isNewView(userID, animeID, fileName)
    .then((isNew) => {
      if (isNew) {
        return db
          .update(anime)
          .set({ views: sql`views + 1` })
          .where(and(eq(anime.id, animeID), eq(anime.deleted, 0)));
      }
    })
    .catch(console.error);

  await db
    .insert(viewHistory)
    .values({
      userID,
      animeID,
      fileName,
      episode: parseFileName(fileName)?.episode,
      currentTime: currentTime ? Math.round(currentTime) : null,
      totalTime: totalTime ? Math.round(totalTime) : null,
      userIP,
      watchMethod,
      useDrive,
    })
    .onDuplicateKeyUpdate({
      set: {
        currentTime: currentTime ? Math.round(currentTime) : null,
        totalTime: totalTime ? Math.round(totalTime) : null,
        userIP,
        lastReportTime: sql`NOW()`,
        useDrive,
      },
    });
}

type HistoryRecord = Record<string, unknown>;

export async function getUserViewHistory(
  userID: number,
  page = 1,
  pageSize = 20,
  animeID?: number,
  latestOnly?: boolean
): Promise<HistoryRecord[]> {
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;

  let rows: Record<string, unknown>[];
  if (latestOnly) {
    const [result] = await db.execute(
      sql`SELECT vh.* FROM ${viewHistory} vh JOIN ( SELECT animeID, MAX(lastReportTime) AS maxReportTime FROM ${viewHistory} WHERE userID = ${userID} GROUP BY animeID ) subquery ON vh.userID = ${userID} AND vh.animeID = subquery.animeID AND vh.lastReportTime = subquery.maxReportTime ORDER BY vh.lastReportTime DESC LIMIT ${pageSize * (page - 1)}, ${pageSize}`
    );
    rows = result as unknown as Record<string, unknown>[];
  } else if (animeID) {
    rows = await db
      .select()
      .from(viewHistory)
      .where(and(eq(viewHistory.userID, userID), eq(viewHistory.animeID, animeID)))
      .orderBy(desc(viewHistory.lastReportTime))
      .limit(pageSize)
      .offset(pageSize * (page - 1));
  } else {
    rows = await db
      .select()
      .from(viewHistory)
      .where(eq(viewHistory.userID, userID))
      .orderBy(desc(viewHistory.lastReportTime))
      .limit(pageSize)
      .offset(pageSize * (page - 1));
  }

  rows = rows.map((record) => {
    const { userID, userIP, ...rest } = record;
    return rest;
  });

  return rows;
}

export async function isNewView(userID: number, animeID: number, fileName: string): Promise<boolean | null> {
  try {
    const [row] = await db
      .select({ count: count() })
      .from(viewHistory)
      .where(
        and(
          eq(viewHistory.userID, userID),
          eq(viewHistory.animeID, animeID),
          eq(viewHistory.fileName, fileName),
          sql`lastReportTime > DATE_SUB(NOW(), INTERVAL 1 HOUR)`
        )
      );
    if (Number(row.count) === 0) return true;
    if (Number(row.count) === 1) return false;
    return null;
  } catch (error) {
    logger("[ViewHistory] isNewView 查询失败:", error);
    return null;
  }
}
