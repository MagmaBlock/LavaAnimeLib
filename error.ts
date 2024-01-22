import { H3Error, H3Event } from "h3";
import { ClientError, ServerError } from "./src/class/error/error";
import chalk from "chalk";

export default defineNitroErrorHandler((error: any, event: H3Event) => {
  // 所有错误回复使用 JSON
  setResponseHeader(event, "Content-Type", "application/json");

  // 处理来自服务器内部掷出的自定义前端可见错误
  if (
    error instanceof H3Error &&
    (error.cause instanceof ClientError || error.cause instanceof ServerError)
  ) {
    setResponseStatus(event, error.cause.getStatusCode());
    return send(event, JSON.stringify({ message: error.cause.message }));
  }
  // 处理路由错误
  else if (error instanceof H3Error && error.statusCode === 405) {
    setResponseStatus(event, error.statusCode);
    return send(
      event,
      JSON.stringify({ message: "请求的端点不存在或方法不被允许" })
    );
  }
  // 处理其他意外内部错误
  else if (error instanceof H3Error) {
    logger.error(chalk.gray("-----------------------"));
    logger.error(error);
    logger.error(chalk.red("[!]"), "运行时错误发生");

    setResponseStatus(event, error.statusCode);
    return send(event, JSON.stringify({ message: error.message }));
  }
  // 处理底层意外错误
  else {
    logger.error(chalk.gray("-----------------------"));
    logger.error(error);
    logger.error(chalk.red("[!]"), "发生底层意外错误");

    setResponseStatus(event, 500);
    return send(event, JSON.stringify({ message: "服务器内部错误" }));
  }
});
