import config from "../config.js";

// 判断客户端 Referer 是否合法
export function inRefererWhiteList(referer) {
  if (config.enableRefererWhiteList) {
    let match = false
    config.refererWhiteList.forEach(rule => {
      if (referer.match(rule)) {
        match = true // 匹配到
      }
    })
    return match
  }
  else {
    return true // 未启用
  }
}