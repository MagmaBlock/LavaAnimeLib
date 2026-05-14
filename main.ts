import type { AddressInfo } from "net";

import app from "./app.js";
import { logger } from "./common/tools/logger.js";

const server = app.listen(8090, () => {
  const address = server.address() as AddressInfo;
  logger(
    "服务器已在",
    address.address + ":" + address.port,
    "上启动."
  );
});
