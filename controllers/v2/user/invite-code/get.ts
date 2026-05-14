import success from "../../../../common/response/success.js";
import unauthorized from "../../../../common/response/unauthorized.js";
import serverError from "../../../../common/response/server-error.js";
import { getUserInviteCodes } from "../../../../services/v2/user/invite-code.js";

export async function getUserInviteCode(req, res) {
  if (!req.user) {
    return unauthorized(res);
  }

  try {
    let codes = await getUserInviteCodes(req.user.id);
    success(res, codes);
  } catch (error) {
    serverError(res);
  }
}
