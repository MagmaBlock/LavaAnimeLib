import chalk from "chalk";
import { logger } from "../../common/tools/logger.js";
import forbidden from "../../controllers/v2/response/4xx/forbidden.js";
import config from "../../common/config.js";

export async function refererChecker(req, res, next) {
  let ref = req.get("Referer") || "无 Referer";

  // 如果不在 Referer 白名单中
  if (!inRefererWhiteList(ref)) {
    logger("拦截了 Referer:", chalk.dim(ref));
    logger("UA:", chalk.dim(req.get("user-agent")));
    return forbidden(res);
  }

  next();
}

function inRefererWhiteList(referer) {
  if (config.security.enableRefererWhiteList) {
    let match = false;
    config.security.refererWhiteList.forEach((rule) => {
      if (referer.match(rule)) {
        match = true; // 匹配到
      }
    });
    return match;
  } else {
    return true; // 未启用
  }
}
