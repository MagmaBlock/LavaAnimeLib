import success from "../../../../common/response/success.js";
import unauthorized from "../../../../common/response/unauthorized.js";
import { findUserByID } from "../../../../services/v2/user/user.js";

export async function getUserInfo(req, res) {
  if (!req.user) {
    return unauthorized(res);
  }
  let { userID } = req.query;
  if (!userID) {
    success(res, { ...req.user, password: undefined });
  } else {
    let userData = await findUserByID(userID);
    success(res, { ...userData, password: undefined });
  }
}
