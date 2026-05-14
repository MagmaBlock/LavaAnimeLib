import { reportUploadMessage as reportUploadMessageService  } from "../../../services/v2/report/upload-message.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";

export async function reportUploadMessage(req, res) {
  let { index, fileName } = req.body;

  try {
    await reportUploadMessageService(index, fileName);
    return success(res, undefined);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
