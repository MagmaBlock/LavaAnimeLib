import { reportUploadMessage as reportUploadMessageService  } from "../../../services/v2/report/upload-message.js";
import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";

export async function reportUploadMessage(req, res) {
  let { index, fileName } = req.body;

  if (typeof index != "string" || typeof fileName != "string")
    return badRequest(res);

  await reportUploadMessageService(index, fileName);
  success(res, undefined);
}
