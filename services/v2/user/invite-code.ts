import { createHash } from "crypto";
import { db } from "../../../common/database/connection.js";
import { inviteCode } from "../../../common/database/schema/invite-code.js";
import { eq } from "drizzle-orm";
import { findUserByID } from "./user.js";

export function generateInviteCode() {
  let randomNumer = Math.random();
  let inviteCodeLong = createHash("sha1")
    .update(randomNumer.toString())
    .digest("base64url");
  inviteCodeLong = inviteCodeLong.replace(/[^a-zA-Z0-9]/g, "");
  let code = inviteCodeLong.slice(0, 12).toLocaleUpperCase();
  return code;
}

export async function saveInviteCode(code, creator, expirationTime) {
  if (!code) throw "未提供 inviteCode!";
  await db.insert(inviteCode).values({
    code,
    code_creator: creator,
    expiration_time: expirationTime,
  });
}

export async function testInviteCode(code) {
  if (!code) throw "未提供 inviteCode!";
  let rows = await db
    .select()
    .from(inviteCode)
    .where(eq(inviteCode.code, code));

  if (rows.length) {
    let expired = false;
    let used = false;
    if (rows[0].expiration_time !== null) {
      if (rows[0].expiration_time < new Date()) {
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

export async function useInviteCode(code, userId) {
  if (!code || !userId) throw "参数缺失";

  await db
    .update(inviteCode)
    .set({ code_user: userId, use_time: new Date() })
    .where(eq(inviteCode.code, code));

  let testResult = await testInviteCode(code);
  if (testResult.real && testResult.used) return true;
  else throw "使用邀请码后验证失败";
}

export async function getUserInviteCodes(userID) {
  if (!userID) throw "no id";

  let rows = await db
    .select()
    .from(inviteCode)
    .where(eq(inviteCode.code_creator, userID));

  if (rows.length) {
    let result = [];
    for (let inv of rows) {
      result.push({
        code: inv.code,
        codeUser: (await findUserByID(inv.code_user)).name,
        codeCreator: (await findUserByID(inv.code_creator)).name,
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
