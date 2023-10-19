import axios from "axios";
import config from "./config.js";
import { logger } from "./tools/logger.js";
import wrongQuery from "../controllers/v2/response/4xx/wrongQuery.js";

const miraiConfig = config.mirai;
// 存储 session
let sessionStorage = null;

// Axios mirai API instance
const miraiHTTPAPI = axios.create({
  baseURL: miraiConfig.adapterSettings.http.baseURL,
});

/**
 * 将自动创建新的 Mirai session
 * @returns {Promise<String | null>}
 */
async function createSession() {
  try {
    let session = await miraiHTTPAPI.post("/verify", {
      verifyKey: miraiConfig.baseConfig.verifyKey,
    });

    if (session.data?.code === 0) {
      sessionStorage = session.data.session;

      await miraiHTTPAPI.post("/bind", {
        sessionKey: sessionStorage,
        qq: miraiConfig.baseConfig.qqID,
      });

      logger("成功刷新 Mirai session.");

      return sessionStorage;
    } else {
      console.warn(session.data, "创建 Mirai session 时失败");
    }
  } catch (error) {
    console.error(error, "创建 Mirai session 时失败");
    return null;
  }
}

/**
 * 测试 sessionKey 是否有效
 * @param {String} sessionKey
 * @returns {Promise<Boolean | null>} 是否有效，为 null 时测试失败
 */
export async function testSessionKey(sessionKey) {
  if (!sessionKey) return false;
  try {
    let result = await miraiHTTPAPI.get("/groupList", {
      params: { sessionKey },
    });
    if (result.data.code === 0) {
      return true;
    } else return false;
  } catch (error) {
    return null;
  }
}

/**
 * 初始化 Mirai (创建 session)
 */
export async function initMirai() {
  await createSession();
  let test = await testSessionKey(sessionStorage);

  if (test) {
    logger("创建的 Mirai session 测试成功.");
  } else {
    logger("创建 Mirai session 刷新失败.");
  }
}

/**
 * 发送一条 QQ 消息.
 * @param {Object[]} messageChain
 * @param {Number} target
 * @param {'group'|'friend'} targetType
 */
export async function sendMiraiMessage(
  messageChain,
  target,
  targetType = "group"
) {
  let apiEndPointPath;
  if (targetType === "group") {
    apiEndPointPath = "/sendGroupMessage";
  } else if (targetType === "friend") {
    apiEndPointPath = "/sendFriendMessage";
  } else throw new Error("非法的目标类型");

  // sessionKey 测试已失效
  if ((await testSessionKey(sessionStorage)) === false) {
    await createSession();
  }

  let result = await miraiHTTPAPI.post(apiEndPointPath, {
    sessionKey: sessionStorage,
    target: target,
    messageChain: messageChain,
  });

  return result.data;
}

/**
 * 发送 QQ 消息给配置文件中配置的所有目标.
 * @param {Object[]} messageChain
 * @returns {Promise<Object[]>}
 */
export async function sendMiraiMessageToAll(messageChain) {
  if (!messageChain) return wrongQuery(res);

  let totalResult = [];

  for (let index in miraiConfig.baseConfig.target.group) {
    let target = miraiConfig.baseConfig.target.group[index];
    let thisResult = await sendMiraiMessage(messageChain, target, "group");
    totalResult.push(thisResult);
    logger(`[Mirai Handler] 发送群 ${target} 完成`);

    await doRandomDelay();
  }

  for (let index in miraiConfig.baseConfig.target.friend) {
    let target = miraiConfig.baseConfig.target.friend[index];
    let thisResult = await sendMiraiMessage(messageChain, target, "friend");
    totalResult.push(thisResult);
    logger(`[Mirai Handler] 发送好友 ${target} 完成`);

    // 如果此遍历并非最后一次，增加随机延迟
    // P.S. 由于使用了 for ... in, 此处的 index 是 String
    if (index != miraiConfig.baseConfig.target.friend.length - 1) {
      await doRandomDelay();
    }
  }

  return totalResult;
}

async function doRandomDelay() {
  let randomDelay = 10000 * Math.random();
  await delay(randomDelay);
  logger(`[Mirai Handler] 完成 ${randomDelay}ms 随机延迟`);
}

/**
 * Promise 延迟
 * @param {Number} delayTime
 * @returns
 */
function delay(delayTime) {
  return new Promise((resolve) => setTimeout(resolve, delayTime));
}

/**
 * 以下为业务无关
 */

/**
 * (仅做测试) 发送测试消息.
 */
async function sendTestMessage() {
  let test = await testSessionKey(sessionStorage);

  if (test === false) {
    await initMirai();
  }

  await sendMiraiMessageToAll([
    {
      type: "Image",
      url: "https://picss.sunbangyan.cn/2023/10/18/e520536ba4d12dd91b4d46dbe9fa2b9d.jpeg",
    },
  ]);

  logger("发送 Mirai 测试消息完成.");
}
