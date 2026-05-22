import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import express from "express";

import config from "./common/config.js";
import { handleAuth } from "./middleware/auth/handler.js";
import {
  requestLogger,
  requestStartRecorder,
} from "./middleware/logger/request-logger.js";
import configHeaders from "./middleware/preprocess/headers.js";
import { refererChecker } from "./middleware/preprocess/referer-checker.js";
import router from "./routes/v2/index.js";

const app = express();

app.use(requestStartRecorder);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", config.security.trustProxy);
app.use(cookieParser());
app.use(refererChecker);
app.use(configHeaders);
app.use(handleAuth);
app.use(requestLogger);

app.use(router);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = __dirname.endsWith(`${path.sep}dist`) ? path.resolve(__dirname, "..") : __dirname;
const nuxtDist = path.resolve(pkgRoot, "../web/.output/public");

if (existsSync(nuxtDist)) {
  app.use(express.static(nuxtDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(nuxtDist, "index.html"));
  });
}

export default app;
