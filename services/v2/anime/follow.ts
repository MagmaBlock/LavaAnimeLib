import { db } from "../../../common/database/connection.js";
import { follow } from "../../../common/database/schema/follow.js";
import { eq, and, count, desc } from "drizzle-orm";

export async function editAnimeFollow(userID, laID, status, remove) {
  if (remove === true) {
    await db
      .delete(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));
    return { removed: true };
  }

  if (status !== undefined) {
    let isExist = await db
      .select()
      .from(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));

    if (isExist.length) {
      await db
        .update(follow)
        .set({ status })
        .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));
    } else {
      await db
        .insert(follow)
        .values({ user_id: userID, anime_id: laID, status });
    }
    return { status };
  }

  return null;
}

export async function getAnimeFollowInfo(userID, laID) {
  let rows = await db
    .select()
    .from(follow)
    .where(and(eq(follow.user_id, userID), eq(follow.anime_id, laID)));

  if (rows.length == 0) {
    return { status: -1 };
  }
  if (rows[0]) {
    return {
      status: rows[0].status,
      editTime: rows[0]?.edit_time?.getTime() ?? 0,
    };
  }
}

export async function getAnimeFollowList(userID, statusList, page, pageSize) {
  let allRawResult = [];
  for (let oneStatus of statusList) {
    let rows = await db
      .select()
      .from(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.status, oneStatus)))
      .orderBy(desc(follow.edit_time), desc(follow.anime_id))
      .limit(pageSize)
      .offset(pageSize * (page - 1));

    for (let followRecord of rows) {
      allRawResult.push({
        status: followRecord.status,
        editTime: followRecord.edit_time.getTime(),
        animeID: followRecord.anime_id,
      });
    }
  }
  return allRawResult;
}

export async function getAnimeFollowTotal(userID) {
  const allStatus = [0, 1, 2];
  let thisUserAllStatus = {};
  for (let status of allStatus) {
    let [result] = await db
      .select({ total: count() })
      .from(follow)
      .where(and(eq(follow.user_id, userID), eq(follow.status, status)));
    thisUserAllStatus[status] = result.total;
  }
  return thisUserAllStatus;
}
