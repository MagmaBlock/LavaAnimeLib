import cookieParser from "cookie-parser";
import express from "express";

import config from "./common/config.js";
import router from "./routes/v2/router.js";
import { logger } from "./common/tools/logger.js";
import { handleAuth } from "./middleware/auth/auth.js";
import {
  requestLogger,
  requestStartRecorder,
} from "./middleware/logger/requestLogger.js";
import configHeaders from "./middleware/preprocess/headers.js";
import { refererChecker } from "./middleware/preprocess/refererChecker.js";

// 创建 app
const app = express();
// 中间件和设置
app.use(requestStartRecorder);
app.use(express.json()); // 使用 Express 4.16 自带的 .json() 中间件 , 使得全局的 req.body 自动解析为 JSON
app.use(express.urlencoded({ extended: true })); // 使用 Express 自带的 URLEncoded 中间件，使得全局的 URl 参数可以被自动解析
app.set("trust proxy", config.security.trustProxy); // 允许 Express 信任上级代理提供的 IP 地址
app.use(cookieParser()); // Cookie 处理器
app.use(refererChecker); // 校验客户端 Referer
app.use(configHeaders); // 回复增加跨域头
app.use(handleAuth); // 验证用户
app.use(requestLogger); // 打印 Log

// 注册业务相关路由
app.use(router);

// 启动服务器
const server = app.listen(8090, () => {
  logger(
    "服务器已在",
    server.address().address + ":" + server.address().port,
    "上启动."
  );
});
