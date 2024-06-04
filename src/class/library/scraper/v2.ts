import { AnimeInfoSource, LibFile, Region } from "@prisma/client";
import nodePath from "path/posix";
import type { LibraryTool } from "../interface";
import { LibraryReader } from "../reader/reader";
import { LibraryScraper } from "./interface";
import { LibraryScrapeResult, NewAnime } from "./result";

/**
 * LavaAnimeLibV2 是番剧库的上一代版本
 * V2 中，对番剧目录的结构规范主要为以下方式：
 *
 * LavaAnimeLib -> 年代 -> 季度/类别 -> 番剧名 + 空格 + Bangumi Subject ID
 *  - 年代包含"年"字，如 "2023年"
 *  - 季度/类别为日本动画的四个季度，附带季节名，如 "1月冬"，同时还有"SP、OVA、OAD等"、"三次元"、"其他地区"、"剧场版"、"网络动画"等分类
 *  - 番剧文件夹包含番剧名、Bangumi Subject ID、BDRip、NSFW，中间使用空格隔开
 *
 * 示例：
 * LavaAnimeLib/
 * - 2023年/
 * -- 1月冬/
 * --- 别当欧尼酱了！ 378862
 * -- 4月春/
 * -- 7月夏/
 * -- 10月秋/
 * -- SP、OVA、OAD等/
 * -- 三次元/
 * -- 其他地区/
 * -- 剧场版/
 * -- 网络动画/
 */
export class LavaAnimeLibV2LibraryScraper implements LibraryScraper {
  libraryTool: LibraryTool;
  reader: LibraryReader;

  constructor(libraryTool: LibraryTool) {
    this.libraryTool = libraryTool;
    this.reader = libraryTool.getReader();
  }

  async scrapeLibrary(pathStartsWith: string) {
    // 创建结果对象
    const scrapeResult = new LibraryScrapeResult();

    // 先对所有文件进行一个染色
    await this.markAnimeForBlankFiles("/");

    // 开始挂削流程
    const allYears = await this.readAllYears();
    logger.debug("所有年份:", allYears);
    // 遍历所有年份
    for (let year of allYears) {
      const allTypes = await this.readTypesInYear(year);
      logger.debug(`${year} 下读取到 ${allTypes.length} 个类型.`);
      // 遍历所有类型
      for (let type of allTypes) {
        const allAnimes = await this.readAnimesInType(year, type);
        if (allAnimes.length) {
          logger.debug(
            `${year} ${type} 下读取到 ${allAnimes.length} 个新动漫.`
          );
        }
        // 遍历所有可能的动画
        for (let anime of allAnimes) {
          await this.parseAnimes(scrapeResult, year, type, anime);
        }
      }
    }
    return scrapeResult;
  }

  /**
   * 读取所有年份
   * @returns 纯数字年份
   */
  private async readAllYears() {
    const root = await this.reader.getFirstSubFilesWithNoAnime("/");
    const allYears = [];
    root.forEach((record) => {
      if (record.isDirectory) {
        // 只读取"xxxx年"的年份
        if (record.name.match(/^\d{4}年$/g)) {
          allYears.push(Number(record.name.replace("年", "")));
        }
      }
    });
    return allYears;
  }

  /**
   * 获取年份下的分类
   */
  private async readTypesInYear(year: number) {
    const yearPath = `/${year}年`;
    const yearRoot = await this.reader.getFirstSubFilesWithNoAnime(yearPath);
    const allTypes = [];
    yearRoot.forEach((record) => {
      if (record.isDirectory) {
        allTypes.push(record.name);
      }
    });

    return allTypes;
  }

  /**
   * 获取所有的动画文件夹名
   */
  private async readAnimesInType(year: number, type: string) {
    const typePath = `/${year}年/${type}`;
    const typeRoot = await this.reader.getFirstSubFilesWithNoAnime(typePath);
    const allAnimes = [];
    typeRoot.forEach((record) => {
      if (record.isDirectory) {
        allAnimes.push(record.name);
      }
    });
    return allAnimes;
  }

  /**
   * 根据 LavaAnimeLibV2 规范的文件夹名, 解析出标题、bgmID、是否为 BD、NSFW
   */
  private parseAnimeFolderName(folderName: string) {
    let bgmID: string = (() => {
      if (folderName.match("\\d+$")) return folderName.match("\\d+$")[0];
      else return "";
    })();
    let title = folderName.replace(bgmID, "").trim();

    // tag parse
    let bdrip = false;
    let nsfw = false;
    if (title.match(/\[BDRip\]/gi)) {
      title = title.replace(/\[BDRip\]/gi, "").trim();
      bdrip = true;
    }
    if (title.match(/\[NSFW\]/gi)) {
      title = title.replace(/\[NSFW\]/gi, "").trim();
      nsfw = true;
    }
    return { bgmID, title, bdrip, nsfw };
  }

  /**
   * 传入每个类型下的动画类型，尝试挂削动画
   * @param resultStore 挂削结果类，用于存储挂削结果
   * @param year 年份
   * @param type 类型
   * @param anime 动画文件夹名
   */
  private async parseAnimes(
    resultStore: LibraryScrapeResult,
    year: number,
    type: string,
    anime: string
  ) {
    // 解析动画文件夹的名称
    const parseFolder = this.parseAnimeFolderName(anime);
    // 路径前缀，在此文件夹中的后代文件都视为此动画的文件
    const pathStartsWith = `/${year}年/${type}/${anime}`;
    // 创建新的 NewAnime 对象
    const newAnime: NewAnime = {
      name: parseFolder.title,
      bdrip: parseFolder.bdrip,
      nsfw: parseFolder.nsfw,
      releaseYear: year,
      releaseSeason: (() => {
        if (["1月冬", "4月春", "7月夏", "10月秋"].includes(type)) {
          return type;
        }
      })(),
      region: (() => {
        // 默认将季度动画的动画地区设置为日本
        if (["1月冬", "4月春", "7月夏", "10月秋"].includes(type)) {
          return Region.Japan;
        }
      })(),
      sites: (() => {
        // 如果此动画有 BGM ID，则将其添加到 sites 中
        if (Number(parseFolder.bgmID) > 0) {
          return [
            {
              siteType: AnimeInfoSource.Bangumi,
              siteId: parseFolder.bgmID,
            },
          ];
        } else {
          return [];
        }
      })(),
    };

    resultStore.addNewAnimeFileMap(newAnime, [
      await this.reader.getFile(pathStartsWith), // 父文件夹
      ...(await this.reader.getAllSubFiles(pathStartsWith)), // 此文件夹下的所有文件
    ]);
  }

  /**
   * 将当前库中没有归属的文件向父级目录寻找 anime 归属标记
   * 即向后代染色
   * @param path
   */
  private async markAnimeForBlankFiles(path: string) {
    const allBlank = await usePrisma.libFile.findMany({
      where: {
        libraryId: this.libraryTool.library.id,
        animeId: null,
        removed: false,
        path: { startsWith: path },
      },
    });

    logger.trace(
      `${path} 下找到了 ${allBlank.length} 个无归属文件(夹), 尝试寻找归属...`
    );

    const cache = new Map<string, LibFile>();

    // 寻找父文件夹中存在的标记并更新标记
    const findFatherOrGrandpa = async (file: LibFile) => {
      // 获取父文件夹的信息
      const parent =
        cache.get(file.path) || (await this.reader.getFile(file.path));
      // 处在根目录中的文件无法向上查找
      if (parent === null) return null;
      if (parent.animeId) {
        // 存入缓存并返回
        cache.set(file.path, parent);
        return parent.animeId;
      } else {
        return await findFatherOrGrandpa(parent);
      }
    };

    for (const file of allBlank) {
      const parentAnimeId = await findFatherOrGrandpa(file);
      if (parentAnimeId) {
        logger.debug(
          `${nodePath.join(file.path, file.name)} 找到了归属: ${parentAnimeId}`
        );
        await usePrisma.libFile.update({
          where: {
            id: file.id,
          },
          data: {
            animeId: parentAnimeId,
          },
        });
      } else {
        logger.trace(`${nodePath.join(file.path, file.name)} 未找到归属.`);
      }
    }

    // const root = await this.reader.readPath(path);
    // const parent = await this.reader.readPathRoot(path);
    // // logger.debug(path);
    // // 尝试染色
    // for (const child of root) {
    //   // 此子没有归属，可以尝试染色
    //   if (child.animeId === null) {
    //     // 如果是根目录, 其不在库中有记录，无法染色
    //     if (path === "/") continue;
    //     // 如果父文件夹并没有归属，那么也无法向下染色
    //     if (parent.animeId === null) continue;
    //     // 染色
    //     await usePrisma.libFile.update({
    //       where: {
    //         id: child.id,
    //       },
    //       data: {
    //         animeId: parent.animeId,
    //       },
    //     });
    //     logger.debug(`文件(夹) ${child.name} 现在属于 ${parent.animeId}`);
    //   }
    // }
    // // 文件夹递归
    // for (const child of root) {
    //   if (child.isDirectory) {
    //     await this.markAnimeForBlankFiles(nodePath.join(path, child.name));
    //   }
    // }
  }
}
