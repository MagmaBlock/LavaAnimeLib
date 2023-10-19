import config from "../../../common/config.js";
import { sendMiraiMessageToAll } from "../../../common/miraiAPI.js";
import success from "../response/2xx/success.js";
import unauthorized from "../response/4xx/unauthorized.js";

export async function sendMiraiMessageAPI(req, res) {
  let { messageChain, verifyKey } = req.body;

  if (config.mirai.baseConfig.enableVerify) {
    if (!verifyKey === config.mirai.baseConfig.verifyKey)
      return unauthorized(res, "verifyKey 错误");
  }

  let result = await sendMiraiMessageToAll(messageChain);

  return success(res, undefined, result);
}
