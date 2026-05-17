import { createAlistClient } from "../../../common/api-clients/alist.js";
import { getDefaultDrive, getDrive } from "../../../services/v2/drive/index.js";

export default async function alistGetter(path?: string) {
  const drive = getDrive(getDefaultDrive())!;
  const client = createAlistClient(drive.host);
  const files = await client.post("/api/fs/list", {
    path: path ?? drive.path,
  });

  return files.data;
}
