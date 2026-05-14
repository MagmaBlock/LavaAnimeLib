import { createAlistClient } from "../../../common/api-clients/alist.js";
import {
  getDefaultDrive,
  getDrive,
} from "../../../services/v2/drive/index.js";

export default async function alistGetter(
  path = getDrive(getDefaultDrive()).path
) {
  let client = createAlistClient(getDrive(getDefaultDrive()).host);
  let files = await client.post("/api/fs/list", {
    path: path,
  });

  return files.data;
}
