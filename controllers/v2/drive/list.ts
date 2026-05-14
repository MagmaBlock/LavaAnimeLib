import success from "../../../common/response/success.js";
import { getDriveList as getDriveListService  } from "../../../services/v2/drive/index.js";

export async function getDriveList(req, res) {
  const latestDriveList = getDriveListService();
  success(res, latestDriveList);
}
