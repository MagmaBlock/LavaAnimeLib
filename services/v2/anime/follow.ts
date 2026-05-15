import { db } from "../../../common/database/connection.js";
import { follow } from "../../../common/database/schema/follow.js";
import { eq, and, count, desc } from "drizzle-orm";

interface FollowEditResult {
  removed?: boolean;
  status?: number;
}

export async function editAnimeFollow(
  userID: number,
  laID: number,
  status?: number,
  remove?: boolean
): Promise<FollowEditResult | null> {
  if (remove === true) {
    await db.delete(follow).where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));
    return { removed: true };
  }

  if (status !== undefined) {
    const isExist = await db
      .select()
      .from(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));

    if (isExist.length) {
      await db
        .update(follow)
        .set({ status })
        .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));
    } else {
      await db.insert(follow).values({ user_id: userID, anime_id: laID, status });
    }
    return { status };
  }

  return null;
}

interface FollowInfo {
  status: number;
  editTime?: number;
}

export async function getAnimeFollowInfo(userID: number, laID: number): Promise<FollowInfo | undefined> {
  const rows = await db
    .select()
    .from(follow)
    .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));

  if (rows.length === 0) {
    return { status: -1 };
  }
  if (rows[0]) {
    return {
      status: rows[0].status,
      editTime: rows[0]?.edit_time?.getTime() ?? 0,
    };
  }
}

interface FollowListRecord {
  status: number;
  editTime: number;
  animeID: number;
}

export async function getAnimeFollowList(
  userID: number,
  statusList: number[],
  page: number,
  pageSize: number
): Promise<FollowListRecord[]> {
  const allRawResult: FollowListRecord[] = [];
  for (const oneStatus of statusList) {
    const rows = await db
      .select()
      .from(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.status, oneStatus)))
      .orderBy(desc(follow.edit_time), desc(follow.anime_id))
      .limit(pageSize)
      .offset(pageSize * (page - 1));

    for (const followRecord of rows) {
      allRawResult.push({
        status: followRecord.status,
        editTime: followRecord.edit_time?.getTime() ?? 0,
        animeID: followRecord.anime_id,
      });
    }
  }
  return allRawResult;
}

export async function getAnimeFollowTotal(userID: number): Promise<Record<string, number>> {
  const allStatus = [0, 1, 2];
  const thisUserAllStatus: Record<string, number> = {};
  for (const status of allStatus) {
    const [result] = await db
      .select({ total: count() })
      .from(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.status, status)));
    thisUserAllStatus[status] = result.total;
  }
  return thisUserAllStatus;
}
