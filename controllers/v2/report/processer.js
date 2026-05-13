import parseFileName from "anime-file-parser";
import dayjs from "dayjs";
import config from "../../../common/config.js";
import { sendMessageToAllTarget } from "../../../common/onebot.js";
import { promiseDB } from "../../../common/sql.js";

/**
 * 检查 upload_message 表中未处理完成的上报消息，并尝试处理
 */
export async function processPendingUploadMessage() {
  await markPendingMessageSkip();

  const [pendingUploadMessages] = await promiseDB.query(
    "SELECT * FROM upload_message WHERE messageSentStatus = 0 AND messageSkiped = 0 AND uploadTime >= ?",
    [dayjs().subtract(1, "days").toDate()]
  );

  if (pendingUploadMessages.length === 0) return;

  let messageChain = await buildSuccessMessageChain(pendingUploadMessages);

  try {
    await sendMessageToAllTarget(messageChain, 0);
  } catch (error) {
    console.error("群消息发送失败，");
    return;
  }

  await promiseDB.query(
    `UPDATE upload_message SET messageSentStatus = 1 WHERE id IN (${pendingUploadMessages.map(() => "?").join(",")})`,
    pendingUploadMessages.map((msg) => msg.id)
  );
}

/**
 * 此任务将检查新增番剧的消息队列，然后将重复更新的上报消息设置为跳过
 * 此任务同时也会检查是否存在同个集数的多个更新记录。若有，将只保留最新的一条
 */
async function markPendingMessageSkip() {
  // 未处理的消息
  const [pendingUploadMessages] = await promiseDB.query(
    "SELECT * FROM upload_message WHERE messageSentStatus = 0 AND messageSkiped = 0 ORDER BY uploadTime DESC"
  );

  for (const pendingUploadMessage of pendingUploadMessages) {
    // 如果这个集数不是第一次更新了，则跳过
    if (await checkEpisodeHasSent(pendingUploadMessage)) {
      await promiseDB.query(
        "UPDATE upload_message SET messageSkiped = 1 WHERE id = ?",
        [pendingUploadMessage.id]
      );
    }

    // 如果某一集有两个待发送群消息的记录，则跳过较早的
    const duplicatedMessages = await findEpisodeDuplicatedPendingMessage(
      pendingUploadMessage
    );
    // 删除多余的消息
    for (const duplicatedMessage of duplicatedMessages) {
      await promiseDB.query(
        "UPDATE upload_message SET messageSkiped = 1 WHERE id = ?",
        [duplicatedMessage.id]
      );
    }
  }
}

/**
 * 检查更新的文件集数是否已经在此前更新过且发送过消息
 * @param {{
 *   id: number;
 *   index: string;
 *   animeID: number | null;
 *   bangumiID: number | null;
 *   fileName: string | null;
 *   messageSentStatus: boolean;
 *   messageSkiped: boolean;
 *   uploadTime: Date | null;
 * }} message - 上传消息对象
 * @returns {Promise<Boolean>} 是否跳过
 */
async function checkEpisodeHasSent(message) {
  if (message.animeID === null) return false;
  if (message.fileName === null) return false;
  const episode = parseFileName(message.fileName)?.episode;
  if (!episode) return false;

  // 查询此番剧所有已经发送过群消息的更新记录
  const [allThisAnime] = await promiseDB.query(
    "SELECT * FROM upload_message WHERE animeID = ? AND fileName IS NOT NULL AND messageSentStatus = 1",
    [message.animeID]
  );

  // 寻找曾经发送此集数的记录
  const episodeHasSentMessage = allThisAnime.find((oldMessage) => {
    if (parseFileName(oldMessage.fileName)?.episode == episode) return true;
  });

  if (episodeHasSentMessage) {
    return true;
  } else {
    return false;
  }
}

/**
 * 寻找此集数是否存在多重的未发送消息
 * @param {{
 *   id: number;
 *   index: string;
 *   animeID: number | null;
 *   bangumiID: number | null;
 *   fileName: string | null;
 *   messageSentStatus: boolean;
 *   messageSkiped: boolean;
 *   uploadTime: Date | null;
 * }} message - 上传消息对象
 * @returns {Promise<{
 *   id: number;
 *   index: string;
 *   animeID: number | null;
 *   bangumiID: number | null;
 *   fileName: string | null;
 *   messageSentStatus: boolean;
 *   messageSkiped: boolean;
 *   uploadTime: Date | null;
 * }[]>} 返回包含重复消息的数组
 */
async function findEpisodeDuplicatedPendingMessage(message) {
  if (!message.animeID) return [];
  if (!message.fileName) return [];
  const episode = parseFileName(message.fileName)?.episode;
  if (!episode) return [];

  const [allThisAnimeMessage] = await promiseDB.query(
    "SELECT * FROM upload_message WHERE animeID = ? AND fileName IS NOT NULL AND messageSentStatus = 0 AND messageSkiped = 0",
    [message.animeID]
  );

  const episodeDuplicatedPendingMessage = allThisAnimeMessage
    .filter((msg) => msg.id != message.id) // 排除自己
    .filter((oldMessage) => {
      if (parseFileName(oldMessage.fileName)?.episode == episode) return true;
    });

  return episodeDuplicatedPendingMessage;
}

/**
 * 构建入库成功的消息
 * @param {{
 *   id: number;
 *   index: string;
 *   animeID: number | null;
 *   bangumiID: number | null;
 *   fileName: string | null;
 *   messageSentStatus: boolean;
 *   messageSkiped: boolean;
 *   uploadTime: Date | null;
 * }[]} pedingMessages - 待处理的 upload_message 记录
 */
async function buildSuccessMessageChain(pedingMessages) {
  /**
   * @type {string[]} 用于存储构建的消息链
   */
  let messageChain = [];

  for (const pedingMessage of pedingMessages) {
    // 文件名渲染
    const animeInfo = (() => {
      if (!pedingMessage.fileName) return "";
      const parse = parseFileName(pedingMessage.fileName);
      let result = "";
      parse.tagedName.forEach((tag) => {
        if (typeof tag == "object") result = result + "[" + tag?.result + "] ";
        if (typeof tag == "string") result = result + tag + " ";
      });
      result = result.replace(/\] \[/g, "][");
      return result;
    })();

    // 集数渲染
    const animeEpisode = (() => {
      const episode = parseFileName(pedingMessage.fileName).episode;
      if (episode) return `🎬 第 ${episode} 话`;
      else return "🎬 未知集数";
    })();

    let anime = null;
    if (pedingMessage.animeID) {
      const [animeRows] = await promiseDB.query(
        "SELECT * FROM anime WHERE id = ? LIMIT 1",
        [pedingMessage.animeID]
      );
      anime = animeRows[0] || null;
    }

    const maybeIndex = (() => {
      if (anime) {
        return {
          year: anime.year,
          type: anime.type,
          name: anime.name,
        };
      }

      return {
        year: pedingMessage.index.split(/\\|\//)[0] ?? null,
        type: pedingMessage.index.split(/\\|\//)[1] ?? null,
        name: pedingMessage.index.split(/\\|\//)[2] ?? null,
      };
    })();

    let bangumiData = null;
    if (pedingMessage.bangumiID) {
      const [bgmRows] = await promiseDB.query(
        "SELECT * FROM bangumi_data WHERE bgmid = ? LIMIT 1",
        [pedingMessage.bangumiID]
      );
      bangumiData = bgmRows[0] || null;
    }

    const posterUrl = (() => {
      const subject = bangumiData?.subjects
        ? JSON.parse(bangumiData?.subjects)
        : {};

      return subject?.images?.large?.replace(
        "https://lain.bgm.tv",
        config.bangumiImage.host
      );
    })();

    const yearDisplay = anime?.year ?? maybeIndex?.year ?? "";
    const typeDisplay = anime?.type ?? maybeIndex?.type ?? "";
    const indexDisplay = [yearDisplay, typeDisplay]
      .filter((item) => item)
      .join("");
    const title = anime?.title ?? maybeIndex?.name ?? "";

    let tempMessageChain = [
      [indexDisplay, title, animeEpisode].filter((i) => i).join(" | "),
      `📁 文件名称 ————`,
      `${animeInfo}`,
    ];

    // 如果成功获取到图片，则追加图片
    if (posterUrl) {
      tempMessageChain = [`[CQ:image,file=${posterUrl}]`, ...tempMessageChain];
    }
    if (messageChain.length) {
      tempMessageChain = ["", ...tempMessageChain];
    }

    messageChain = [...messageChain, ...tempMessageChain];
  }

  messageChain = [
    ...messageChain,
    "",
    `🎉 以上 ${pedingMessages.length} 个剧集刚刚更新了`,
  ];

  return messageChain.join("\n");
}
