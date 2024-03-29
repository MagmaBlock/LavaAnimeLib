import success from "../../response/2xx/success.js";
import forbidden from "../../response/4xx/forbidden.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";
import { updateUserData } from "./updateUser.js";
import { findUserByID } from "../findUser.js";

// 暂时没啥用
// POST
// 修改用户的权限 API
export async function updatePermissionAPI(req, res) {
  let { permission, userID } = req.body;
  if (!permission || !userID) return wrongQuery(res);
  // 权限检查
  let user = await findUserByID(userID);
  if (!user?.data?.permission?.admin) {
    return forbidden(res);
  }

  try {
    await updateUserData({ permission }, userID);
    success(res);
  } catch (error) {
    return serverError(res);
  }
}
