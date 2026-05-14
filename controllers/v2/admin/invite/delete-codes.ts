import { deleteInviteCode } from "../../../../services/v2/admin/invite.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";

export async function deleteCodes(req, res) {
  let codes = req.body?.codes;
  if (!Array.isArray(codes)) return badRequest(res);
  codes.forEach((code) => {
    if (typeof code != "string") return badRequest(res);
  });

  try {
    for (let code of codes) {
      await deleteInviteCode(code);
    }
  } catch (error) {
    return serverError(res);
  }

  success(res, undefined);
}
