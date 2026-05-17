import { createHash } from "crypto";
import { db } from "../../../common/database/connection.js";
import { inviteCode } from "../../../common/database/schema/invite-code.js";
import { eq } from "drizzle-orm";
import { findUserByID } from "./user.js";

export function generateInviteCode(): string {
  const randomNumer = Math.random();
  let inviteCodeLong = createHash("sha1")
    .update(randomNumer.toString())
    .digest("base64url");
  inviteCodeLong = inviteCodeLong.replace(/[^a-zA-Z0-9]/g, "");
  return inviteCodeLong.slice(0, 12).toLocaleUpperCase();
}

export async function saveInviteCode(code: string, creator: number, expirationTime?: Date): Promise<void> {
  if (!code) throw new Error("未提供 inviteCode!");
  await db.insert(inviteCode).values({
    code,
    code_creator: creator,
    expiration_time: expirationTime,
  });
}

interface InviteTestResult {
  real: boolean;
  expired: boolean | null;
  used: boolean | null;
}

export async function testInviteCode(code: string): Promise<InviteTestResult> {
  if (!code) throw new Error("未提供 inviteCode!");
  const rows = await db
    .select()
    .from(inviteCode)
    .where(eq(inviteCode.code, code));

  if (rows.length) {
    let expired = false;
    let used = false;
    if (rows[0].expiration_time !== null) {
      if (rows[0].expiration_time! < new Date()) {
        expired = true;
      }
    }
    if (rows[0].use_time) {
      used = true;
    }
    return { real: true, expired, used };
  } else {
    return { real: false, expired: null, used: null };
  }
}

export async function useInviteCode(code: string, userId: number): Promise<boolean> {
  if (!code || !userId) throw new Error("参数缺失");

  await db
    .update(inviteCode)
    .set({ code_user: userId, use_time: new Date() })
    .where(eq(inviteCode.code, code));

  const testResult = await testInviteCode(code);
  if (testResult.real && testResult.used) return true;
  throw new Error("使用邀请码后验证失败");
}

interface InviteCodeRecord {
  code: string;
  codeUser: unknown;
  codeCreator: unknown;
  createTime: Date | null;
  useTime: Date | null;
  expirationTime: Date | null;
}

export async function getUserInviteCodes(userID: number): Promise<InviteCodeRecord[]> {
  if (!userID) throw new Error("no id");

  const rows = await db
    .select()
    .from(inviteCode)
    .where(eq(inviteCode.code_creator, userID));

  if (rows.length) {
    const result: InviteCodeRecord[] = [];
    for (const inv of rows) {
      const codeUser = await findUserByID(inv.code_user!);
      const codeCreator = await findUserByID(inv.code_creator!);
      result.push({
        code: inv.code,
        codeUser: codeUser ? codeUser.name : null,
        codeCreator: codeCreator ? codeCreator.name : null,
        createTime: inv.create_time,
        useTime: inv.use_time,
        expirationTime: inv.expiration_time,
      });
    }
    return result;
  } else {
    return [];
  }
}
