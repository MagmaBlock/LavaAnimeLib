import type { AddressInfo } from "net";

import app from "./app.js";
import { log } from "./common/tools/logger.js";
import { startBangumiCacheScheduler } from "./services/v2/bangumi/cache.js";

const server = app.listen(8090, () => {
  const address = server.address() as AddressInfo;
  log.info("服务器已在 %s:%s 上启动", address.address, address.port);
  startBangumiCacheScheduler();
});
