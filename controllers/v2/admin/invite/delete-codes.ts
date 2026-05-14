import { deleteInviteCode } from "../../../../services/v2/admin/invite.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function deleteCodes(req, res) {
  let codes = req.body.codes;

  try {
    for (let code of codes) {
      await deleteInviteCode(code);
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }

  success(res, undefined);
}
