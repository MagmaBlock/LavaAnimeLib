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

export default app;
