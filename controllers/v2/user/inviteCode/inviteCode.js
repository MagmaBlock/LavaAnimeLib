import { createHash } from "crypto";
import { promiseDB } from "../../../../common/sql.js";
import { findUserByID } from "../findUser.js";

// 生成邀请码，12 位字母数字
export function generateInviteCode() {
  let randomNumer = Math.random();
  let inviteCodeLong = createHash("sha1")
    .update(randomNumer.toString())
    .digest("base64url");
  inviteCodeLong = inviteCodeLong.replace(/[^a-zA-Z0-9]/g, "");
  let inviteCode = inviteCodeLong.slice(0, 12).toLocaleUpperCase();
  return inviteCode;
}

// 保存一个新的邀请码到数据库
export async function saveInviteCode(inviteCode, creator, expirationTime) {
  if (!inviteCode) throw "未提供 inviteCode!";
  await promiseDB.query(
    `INSERT INTO invite_code (code, code_creator, expiration_time)
        VALUES
        (?, ?, ?)`,
    [inviteCode, creator, expirationTime]
  );
}

// 测试邀请码是否可用
export async function testInviteCode(inviteCode) {
  if (!inviteCode) throw "未提供 inviteCode!";
  let queryResult = await promiseDB.query(
    "SELECT * FROM invite_code WHERE code = ?",
    [inviteCode]
  );

  if (queryResult[0].length) {
    // 存在结果
    let expired = false;
    let used = false;
    if (queryResult[0][0].expiration_time !== null) {
      // 有过期时间设置，判断是否过期
      if (queryResult[0][0].expiration_time < new Date()) {
        // 过期了
        expired = true;
      }
    }
    if (queryResult[0][0].use_time) {
      // 已经被标记了使用时间
      used = true;
    }
    return { real: true, expired, used };
  } else {
    return { real: false, expired: null, used: null };
  }
}

// 使用邀请码
export async function useInviteCode(inviteCode, user) {
  if ((!inviteCode, !user)) throw "参数缺失";

  await promiseDB.query(
    `UPDATE invite_code
            SET code_user = ?, use_time = ?
            WHERE code = ?`,
    [user, new Date(), inviteCode]
  );

  let testResult = await testInviteCode(inviteCode);
  if (testResult.real && testResult.used) return true;
  else throw "使用邀请码后验证失败";
}

// 查询某用户创建的索引验证码
export async function getUserInviteCodes(userID) {
  if (!userID) throw "no id";

  let findResult = await promiseDB.query(
    "SELECT * FROM invite_code WHERE code_creator = ?",
    [userID]
  );
  if (findResult[0].length) {
    let result = [];
    for (let inv of findResult[0]) {
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
