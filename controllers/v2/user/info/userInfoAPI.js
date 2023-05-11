import success from "../../response/2xx/success.js";
import unauthorized from "../../response/4xx/unauthorized.js";
import { findUserByID } from "../findUser.js";

// 查询当前 Token 或别人的用户信息
export async function getUserInfoAPI(req, res) {
  if (!req.user) {
    return unauthorized(res);
  }
  let { userID } = req.query;
  if (!userID) {
    // 查询当前 Token
    success(res, { ...req.user, password: undefined });
  } else {
    // 查询指定用户 ID
    let userData = await findUserByID(userID);
    success(res, { ...userData, password: undefined });
  }
}
