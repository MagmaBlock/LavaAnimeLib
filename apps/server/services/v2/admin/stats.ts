import { count, and, or, isNull, gt, sql, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { user } from "../../../common/database/schema/user.js";
import { anime } from "../../../common/database/schema/anime.js";
import { inviteCode } from "../../../common/database/schema/invite-code.js";
import { viewHistory } from "../../../common/database/schema/view-history.js";

export interface AdminStats {
  userCount: number;
  animeCount: number;
  validInviteCodeCount: number;
  weekViewCount: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [userResult] = await db.select({ value: count() }).from(user);
  const [animeResult] = await db.select({ value: count() }).from(anime).where(eq(anime.deleted, 0));
  const [inviteResult] = await db
    .select({ value: count() })
    .from(inviteCode)
    .where(
      and(
        isNull(inviteCode.code_user),
        or(
          gt(inviteCode.expiration_time, sql`current_time()`),
          isNull(inviteCode.expiration_time)
        )
      )
    );
  const [weekViewResult] = await db
    .select({ value: count() })
    .from(viewHistory)
    .where(sql`DATEDIFF(NOW(), ${viewHistory.lastReportTime}) <= 7`);

  return {
    userCount: userResult.value,
    animeCount: animeResult.value,
    validInviteCodeCount: inviteResult.value,
    weekViewCount: weekViewResult.value,
  };
}
