import { promiseDB } from "../../../../common/sql.js";
import success from "../../response/2xx/success.js";
import serverError from "../../response/5xx/serverError.js";

// 获取全部有效邀请码
// /v2/admin/invite/all-valid-codes
export async function allVaildCodesAPI(req, res) {
  try {
    let result = await promiseDB.query(
      `SELECT * FROM invite_code
       WHERE code_user IS NULL AND expiration_time > current_time() 
       OR code_user IS NULL AND expiration_time IS NULL
       ORDER BY create_time DESC`
    );
    success(
      res,
      result[0].map((code) => {
        return {
          code: code.code,
          expirationTime:
            code.expiration_time instanceof Date
              ? code.expiration_time.getTime()
              : null,
        };
      })
    );
  } catch (error) {
    serverError(res);
  }
}
