import { AlistAPI } from "../../../common/api.js";
import { getDefaultDrive, getDrive } from "../../../controllers/v2/drive/main.js";

export default async function alistGetter(
  path = getDrive(getDefaultDrive()).path
) {
  let files = await AlistAPI.post("/api/fs/list", {
    path: path,
  });

  return files.data;
}
