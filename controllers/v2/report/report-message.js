import { prisma } from "../../../prisma/client.js";
import path from "path";
import wrongQuery from "../response/4xx/wrongQuery.js";
import success from "../response/2xx/success.js";
import { sendMiraiMessageToAll } from "../../../common/miraiAPI.js";
import parseFileName from "anime-file-parser";
import config from "../../../common/config.js";
import { logger } from "../../../common/tools/logger.js";

export async function reportUploadMessageAPI(req, res) {
  let { index, fileName } = req.body;

  if (typeof index != "string" || typeof fileName != "string")
    return wrongQuery(res);

  // 分割文件路径, 取出最后三层
  let filePath = path.normalize(index).split(/\\|\//);
  let trueIndex = filePath.slice(-3);

  let possibleAnime = await prisma.anime.findFirst({
    where: {
      year: trueIndex[0],
      type: trueIndex[1],
      name: trueIndex[2],
    },
  });

  let bangumiID = trueIndex.slice(-1)[0].match(/(?<= )\d{1,6}$/);
  let parseBangumiID = Number.parseInt(bangumiID?.[0]);
  if (parseBangumiID !== NaN) {
    bangumiID = parseBangumiID;
  }

  let createResult = await prisma.upload_message.create({
    data: {
      index: trueIndex.join("/"),
      animeID: possibleAnime?.id ?? null,
      bangumiID: bangumiID ?? null,
      fileName,
    },
  });

  // 开始推送 Mirai 消息
  let messageChain = await buildSuccessMessageChain(
    possibleAnime?.id,
    bangumiID,
    trueIndex,
    fileName
  );

  logger(messageChain);

  try {
    await sendMiraiMessageToAll(messageChain);

    await prisma.upload_message.update({
      data: {
        messageSentStatus: true,
      },
      where: {
        id: createResult.id,
      },
    });
  } catch (error) {
    console.error(error);
  }

  success(res);
}

/**
 * 构建入库成功的消息
 * @param {Number} animeID
 * @param {Number} bangumiID
 * @param {Array} trueIndex
 * @param {String} fileName
 */
async function buildSuccessMessageChain(
  animeID,
  bangumiID,
  trueIndex,
  fileName
) {
  // 文本化 anime-file-parser 的文件名 Tag
  const animeInfo = (() => {
    const parse = parseFileName(fileName);
    let result = "";
    parse.tagedName.forEach((tag) => {
      if (typeof tag == "object") result = result + "[" + tag?.result + "] ";
      if (typeof tag == "string") result = result + tag + " ";
    });
    result = result.replace(/\] \[/g, "][");
    return result;
  })();

  // 更佳打印集数
  const animeEpisode = (() => {
    const episode = parseFileName(fileName).episode;
    if (episode) {
      return `第 ${episode} 话`;
    } else {
      return `未知的集数`;
    }
  })();

  let anime = animeID
    ? await prisma.anime.findFirst({ where: { id: animeID } })
    : null;

  let bangumiData = bangumiID
    ? await prisma.bangumi_data.findFirst({ where: { bgmid: bangumiID } })
    : null;

  let posterUrl = JSON.parse(
    bangumiData?.subjects ?? "{}"
  )?.images?.large?.replace("https://lain.bgm.tv", config.bangumiImage.host);

  let index = anime ? `${anime.year}${anime.type} ` : "";
  let title = anime?.title ?? trueIndex.slice(-1)[0];

  // 不带图片的消息链
  let messageChain = [
    {
      type: "Plain",
      text: `${index}${title} | 🎬 ${animeEpisode}\n`,
    },
    {
      type: "Plain",
      text: `📁 文件名称 ————\n${animeInfo}\n\n`,
    },
    {
      type: "Plain",
      text: `🎉 已更新完成`,
    },
  ];

  // 如果成功获取到图片，则追加图片
  if (posterUrl) {
    messageChain = [
      {
        type: "Image",
        url: posterUrl,
      },
      ...messageChain,
    ];
  }

  return messageChain;
}
