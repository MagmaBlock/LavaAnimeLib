import { promiseDB } from "../../../common/database/connection.js";

export async function getAllValidCodes() {
  let result = await promiseDB.query(
    `SELECT * FROM invite_code
       WHERE code_user IS NULL AND expiration_time > current_time() 
       OR code_user IS NULL AND expiration_time IS NULL
       ORDER BY create_time DESC`
  );
  return result[0].map((code) => {
    return {
      code: code.code,
      expirationTime:
        code.expiration_time instanceof Date
          ? code.expiration_time.getTime()
          : null,
    };
  });
}

/**
 * 删除一个邀请码, 为 DELETE 查询, 不会校验是否存在
 * @param {String}
 * @throws
 */
export async function deleteInviteCode(code) {
  if (typeof code != "string") throw "邀请码不是 String!";
  return await promiseDB.query("DELETE FROM invite_code WHERE code = ?", [
    code,
  ]);
}
