import success from "../../../common/response/success.js";
import unauthorized from "../../../common/response/unauthorized.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { removeToken } from "../../../services/v2/user/token.js";

export async function userLogout(req, res) {
  let { all } = req.body;
  let token = req.get("Authorization");

  if (!token) return badRequest(res);

  try {
    let logout = await removeToken(token, all);
    if (logout) {
      success(res, undefined);
    } else {
      return unauthorized(res);
    }
  } catch (error) {
    return serverError(res);
  }
}
