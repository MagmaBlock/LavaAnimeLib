import success from "../../response/2xx/success.js"
import forbidden from "../../response/4xx/forbidden.js"
import unauthorized from "../../response/4xx/unauthorized.js"
import serverError from "../../response/5xx/serverError.js"
import { generateInviteCode, getUserInviteCodes, saveInviteCode, testInviteCode } from "./inviteCode.js"

export async function userInviteCodeGetAPI(req, res) {
  if (!req.user) {
    return unauthorized(res)
  }

  try {
    let codes = await getUserInviteCodes(req.user.id)
    success(res, codes)
  } catch (error) {
    serverError(res)
  }
}

export async function userInviteCodeNewAPI(req, res) {
  if (!req.user) {
    return unauthorized(res)
  }
  if (req.user.data?.permission?.admin) { // 若有管理权限，可更改更多
    let { amount, expirationTime } = req.body
    let inviteCodes = []

    if (!amount) amount = 1
    if (!expirationTime) expirationTime = null

    // 创建指定数量的邀请码
    for (let i = 0; i < amount; i++) {
      inviteCodes.push({
        code: generateInviteCode(),
        expirationTime: expirationTime ? new Date(expirationTime) : undefined
      })
    }

    // 准备写入
    for (let code of inviteCodes) {
      try {
        await saveInviteCode(code.code, req.user.id, code.expirationTime)
      } catch (error) {
        console.error(error);
        // 删除保存失败的邀请码
        inviteCodes = inviteCodes.filter(ele => {
          return ele.code != code.code
        })
      }
    }

    success(res, inviteCodes)


  } else { // 临时，未来开放普通用户创建邀请码
    return forbidden(res)
  }
}