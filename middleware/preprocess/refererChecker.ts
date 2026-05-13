import chalk from "chalk";
import { logger } from "../../common/tools/logger.js";
import forbidden from "../../controllers/v2/response/4xx/forbidden.js";
import config from "../../common/config.js";

export async function refererChecker(req, res, next) {
  let ref = req.get("Referer");

  // 如果不在 Referer 白名单中
  if (!inRefererWhiteList(ref)) {
    logger("拦截了 Referer:", chalk.dim(ref ?? "空 Referer Header"));
    logger("UA:", chalk.dim(req.get("user-agent")));
    return forbidden(res);
  }

  next();
}

function inRefererWhiteList(referer) {
  if (config.security.enableRefererWhiteList) {
    // 空 Referer
    if (referer === undefined && config.security.allowEmptyReferer) return true;
    // 匹配 Referer
    for (let rule of config.security.refererWhiteList) {
      if (referer?.match(rule)) {
        return true; // 匹配到
      }
    }
    return false; // 未匹配到
  }
  return true; // 未启用
}
