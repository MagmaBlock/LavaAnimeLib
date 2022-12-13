import serverError from "../error/serverError.js"
import unauthorized from "../error/unauthorized.js"
import wrongQuery from "../error/wrongQuery.js"
import { removeToken } from "./token.js"

export async function userLogoutAPI(req, res) {
  let { all } = req.body
  let { token } = req.cookies

  // 请求中并未携带 token
  if (!token) return wrongQuery(res)

  try {
    let logout = await removeToken(token, all)
    if (logout) {
      res.send({ code: 200, message: '成功' })
    } else {
      return unauthorized(res)
    }
  } catch (error) {
    return serverError(res)
  }
}