import { eq, and, or, isNull, gt, sql } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { inviteCode } from "../../../common/database/schema/invite-code.js";

interface ValidCodeResult {
  code: string;
  expirationTime: number | null;
}

export async function getAllValidCodes(): Promise<ValidCodeResult[]> {
  const rows = await db
    .select()
    .from(inviteCode)
    .where(
      and(
        isNull(inviteCode.code_user),
        or(
          gt(inviteCode.expiration_time, sql`current_time()`),
          isNull(inviteCode.expiration_time)
        )
      )
    )
    .orderBy(inviteCode.create_time);

  return rows.map((code) => ({
    code: code.code,
    expirationTime:
      code.expiration_time instanceof Date
        ? code.expiration_time.getTime()
        : null,
  }));
}

export async function deleteInviteCode(code: string): Promise<unknown> {
  if (typeof code !== "string") throw new Error("邀请码不是 String!");
  return await db.delete(inviteCode).where(eq(inviteCode.code, code));
}
