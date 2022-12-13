import serverError from "../response/5xx/serverError.js"
import unauthorized from "../response/4xx/unauthorized.js"
import wrongQuery from "../response/4xx/wrongQuery.js"
import { removeToken } from "./token.js"
import success from "../response/2xx/success.js"

export async function userLogoutAPI(req, res) {
  let { all } = req.body
  let { token } = req.cookies

  // 请求中并未携带 token
  if (!token) return wrongQuery(res)

  try {
    let logout = await removeToken(token, all)
    if (logout) {
      success(res)
    } else {
      return unauthorized(res)
    }
  } catch (error) {
    return serverError(res)
  }
}