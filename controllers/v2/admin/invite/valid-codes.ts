import { getAllValidCodes as getAllValidCodesService  } from "../../../../services/v2/admin/invite.js";
import success from "../../../../common/response/success.js";
import serverError from "../../../../common/response/server-error.js";

export async function getAllValidCodes(req, res) {
  try {
    let result = await getAllValidCodesService();
    success(res, result);
  } catch (error) {
    serverError(res);
  }
}
