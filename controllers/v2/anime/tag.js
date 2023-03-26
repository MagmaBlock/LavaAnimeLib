import _ from "lodash";
import aniep from "aniep";

import dict from "../../../assets/tagsDict.js";

export function parseFileName(fileName) {
  // 传入文件名和词典，传出对此文件的解析结果

  let extensionName = getExtensionName(fileName, dict);
  let trueName = extensionName.trueName || fileName;

  // 先进行简单拆分，只用 [ ] & + 拆开文件名
  let splitedFileName = trueName.split(/\[|\]|&|＆|\+/); // 拆分
  splitedFileName = tidyStringArray(splitedFileName);

  // 查找组名
  let groupNames = new Array(); // 找到的发布组名会存在此内
  for (let i in splitedFileName) {
    if (i >= 3) break; // 仅判断前三个词
    let isGroup = IsThisWordAGroupName(splitedFileName[i], dict);
    if (isGroup) {
      // 如果匹配成功
      splitedFileName[i] = ""; // 清空该词
      groupNames.push(isGroup);
    }
  }
  splitedFileName = tidyStringArray(splitedFileName); // 删除被清空的词即空格

  // 拆的更散
  let reformedFileName = new Array();
  for (let i in splitedFileName) {
    let thisLine = splitedFileName[i].split(/\||\(|\)|-|_| /); // 这次用 | ( ) - _ 还有空格拆开
    reformedFileName.push(thisLine);
  }
  reformedFileName = _.concat(...reformedFileName); // 将零散的数组合并
  reformedFileName = tidyStringArray(reformedFileName); // trim 和删除空格

  // 删除无用词汇
  for (let i in reformedFileName) {
    let isGarbage = garbageCleaner(reformedFileName[i], dict);
    if (isGarbage) reformedFileName[i] = "";
  }
  reformedFileName = tidyStringArray(reformedFileName); // trim 和删除空格

  // 遍历每个被分割的词汇，将他们替换为含有结果的对象，最有用的部分
  for (let i in reformedFileName) {
    reformedFileName[i] = matchThisWord(reformedFileName[i], dict); // 匹配词典
  }

  // 开始识别文件集数, 使用 aniep 库
  let thisEpisode = aniep(fileName);
  if (Array.isArray(thisEpisode)) {
    thisEpisode = `${thisEpisode[0]}-${thisEpisode[1]}`;
  }
  if (typeof thisEpisode == "string") {
    thisEpisode = thisEpisode.replace("|", "/");
  }

  // 以下为旧版的集数识别算法
  // for (let i = reformedFileName.length; i > 0; i--) { // 习惯情况下均为集数在后，所以从后往前匹配
  //     let thisWord = reformedFileName[i]
  //     if (typeof thisWord == 'string') {
  //         let isSeason = thisWord.replace(/S\d{1,2}/i, '').trim() // 直接删除季度名
  //         let isEpisode = isSeason.replace(/(EP|E|P|)\d{1,2}(END|v2|v3|\.5|集|)/i, '')
  //         if (!isEpisode) {
  //             thisEpisode = isSeason.replace(/END|P|E|v2|v3|集/gi, '')
  //             break
  //         }
  //     }
  // }
  return {
    groupNames,
    tagedName: reformedFileName,
    extensionName,
    episode: thisEpisode,
  };
}

function IsThisWordAGroupName(word, dict) {
  // 传入拆分后的单词和词典，返回匹配结果或原单词
  let groupDict = dict.group; // 发布组词典的内容
  for (let i in groupDict) {
    // 遍历此词典的内容
    let thisDictRegExp = groupDict[i].from;
    let thisDictResult = groupDict[i].to;
    let thisWordReplaced = word.replace(thisDictRegExp, "").trim();
    if (!thisWordReplaced) {
      return thisDictResult;
    }
  }

  return false; // 什么也没匹配到，返回原内容
}

function matchThisWord(word, dict) {
  // 传入拆分后的单词和词典，返回匹配结果或原单词
  let dictUsed = ["source", "quality", "language", "other"];
  for (let i in dictUsed) {
    // 遍历使用的词典列表
    let thisDictName = dictUsed[i]; // 此词典名
    let thisDict = dict[thisDictName]; // 此词典内容
    for (let j in thisDict) {
      // 遍历此词典的内容
      let thisDictRegExp = thisDict[j].from;
      let thisDictResult = thisDict[j].to;
      let thisWordReplaced = word.replace(thisDictRegExp, "").trim();
      if (!thisWordReplaced) {
        return { result: thisDictResult, raw: word, type: thisDictName };
      }
    }
  }
  return word; // 什么也没匹配到，返回原内容
}

function garbageCleaner(word, dict) {
  // 清理垃圾，用 delete 规则删除没用的词
  let garbageDict = dict.delete; // 垃圾正则
  for (let i in garbageDict) {
    // 遍历此词典的内容
    let thisDictRegExp = garbageDict[i];
    let thisWordReplaced = word.replace(thisDictRegExp, "").trim();
    if (!thisWordReplaced) {
      return true;
    }
  }
  return false; // 什么也没匹配到，不是垃圾
}

function getExtensionName(fileName, dict) {
  // 获取拓展名
  let splitedFileName = fileName.split(".");
  let lastOne = _.last(splitedFileName);
  let trueName = fileName.replace(new RegExp("(.*)\\." + lastOne, "i"), "$1"); // 移除后缀名的文件名
  for (let i in dict.format) {
    let thisDict = dict.format[i];
    let matched = lastOne.replace(thisDict.from, "").trim();
    if (!matched) {
      return {
        result: thisDict.to,
        type: thisDict.type,
        raw: lastOne,
        trueName: trueName,
      };
    }
  }
  if (lastOne.length <= 5) return { raw: lastOne, trueName: trueName };
  else return false;
}

function tidyStringArray(list) {
  // 传入一个字符串列表，返回 trim 和删除假值后的结果
  for (let i in list) list[i] = list[i].trim(); // 去除首尾空格
  return _.compact(list); // 删除所有空格和假值
}
