import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { updateUserData } from "../../../../services/v2/user/profile.js";
import { findUserByID } from "../../../../services/v2/user/user.js";

export async function updatePermission(req, res) {
  let { permission, userID } = req.body;
  if (!permission || !userID) return badRequest(res);

  let user = await findUserByID(userID);
  if (!user?.data?.permission?.admin) {
    return forbidden(res);
  }

  try {
    await updateUserData({ permission }, userID);
    success(res, undefined);
  } catch (error) {
    return serverError(res);
  }
}
