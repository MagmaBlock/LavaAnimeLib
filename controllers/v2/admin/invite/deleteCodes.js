
import { promiseDB } from "../../../../common/sql.js";
import success from "../../response/2xx/success.js";
import wrongQuery from '../../response/4xx/wrongQuery.js'
import serverError from "../../response/5xx/serverError.js";

// 删除邀请码(可批量)
// /v2/admin/invite/delete-codes
export async function deleteCodesAPI(req, res) {
  let codes = req.body?.codes
  if (!Array.isArray(codes)) return wrongQuery(res)
  codes.forEach(code => { if (typeof code != 'string') return wrongQuery(res) })

  try {
    for (let code of codes) {
      await deleteInviteCode(code)
    }
  } catch (error) {
    return serverError(res)
  }

  success(res)
}

/**
 * 删除一个邀请码, 为 DELETE 查询, 不会校验是否存在
 * @param {String}
 * @throws
 */
export async function deleteInviteCode(code) {
  if (typeof code != 'string') throw '邀请码不是 String!'
  return await promiseDB.query(
    'DELETE FROM invite_code WHERE code = ?',
    [code]
  )
}