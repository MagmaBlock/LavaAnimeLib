import {
  AnimeSiteLink,
  AnimeSiteType,
  LibFile,
  Prisma,
  Region,
} from "@prisma/client";
import type { LibraryTool } from "../interface";
import { LibraryScraper } from "./interface";
import nodePath from "path/posix";
import { LibraryReader } from "../reader";

/**
 * LavaAnimeLibV2 是番剧库的上一代版本
 * V2 中，对番剧目录的结构设计主要为以下方式：
 *
 * 年代(含"年"字) -> 类别 -> 番剧名 + 空格 + Bangumi Subject ID
 *
 * 即：
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

  async scrapeLibrary() {
    // 先对所有文件进行一个染色
    await this.markAnimeForBlankFiles("/");
    // 开始挂削流程
    const allYears = await this.readAllYears();
    logger.debug("所有年份:", allYears);
    for (let year of allYears) {
      const allTypes = await this.readTypesInYear(year);
      logger.debug(`${year} 下读取到 ${allTypes.length} 个类型.`);
      for (let type of allTypes) {
        const allAnimes = await this.readAnimesInType(year, type);
        logger.debug(`${year} ${type} 下读取到 ${allAnimes.length} 个动漫.`);
        for (let anime of allAnimes) {
          await this.tryCreateAnime(year, type, anime);
        }
      }
    }
  }

  /**
   * 读取所有年份
   * @returns 纯数字年份
   */
  private async readAllYears() {
    const root = await this.reader.readPathOnlyNullAnime("/");
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
    const yearRoot = await this.reader.readPathOnlyNullAnime(yearPath);
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
    const typeRoot = await this.reader.readPathOnlyNullAnime(typePath);
    const allAnimes = [];
    typeRoot.forEach((record) => {
      if (record.isDirectory) {
        allAnimes.push(record.name);
      }
    });
    return allAnimes;
  }

  /**
   * 根据动画的文件夹名, 解析出标题、bgmID、是否为 BD、NSFW
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
   * 尝试创建动画
   */
  private async tryCreateAnime(year: number, type: string, anime: string) {
    const parseFolder = this.parseAnimeFolderName(anime);

    const result = {
      pathStartsWith: `/${year}年/${type}/${anime}`,
      name: parseFolder.title,
      bdrip: parseFolder.bdrip,
      nsfw: parseFolder.nsfw,
      releaseYear: year,
      releaseSeason: (() => {
        if (["1月冬", "4月春", "7月夏", "10月秋"].includes(type)) {
          return type;
        }
        return null;
      })(),
      region: (() => {
        if (["1月冬", "4月春", "7月夏", "10月秋"].includes(type)) {
          return Region.Japan;
        }
        return null;
      })(),
      sites: (() => {
        if (Number(parseFolder.bgmID) !== 0) {
          return {
            siteType: AnimeSiteType.Bangumi,
            siteId: parseFolder.bgmID,
          };
        } else {
          return null;
        }
      })(),
    };

    try {
      const anime = await usePrisma.anime.create({
        data: {
          name: result.name,
          bdrip: result.bdrip,
          nsfw: result.nsfw,
          releaseYear: result.releaseYear,
          releaseSeason: result.releaseSeason,
          region: result.region,
        },
      });

      if (result.sites !== null) {
        await usePrisma.animeSiteLink.upsert({
          where: { siteId_siteType: result.sites },
          update: { animes: { connect: { id: anime.id } } },
          create: {
            ...result.sites,
            animes: { connect: { id: anime.id } },
          },
        });
      }

      logger.info(
        `LavaAnimeLibV2 挂削创建了新动画 [#${anime.id}] ${anime.name}`
      );

      // 为根目录配置归属为刚创建的动画
      const rootUpdate = await usePrisma.libFile.update({
        where: {
          uniqueFileInLib: {
            libraryId: this.libraryTool.id,
            path: nodePath.parse(result.pathStartsWith).dir,
            name: nodePath.parse(result.pathStartsWith).base,
          },
        },
        data: {
          animeId: anime.id,
        },
      });
      // 为子文件配置归属
      const update = await usePrisma.libFile.updateMany({
        where: {
          libraryId: this.libraryTool.id,
          path: { startsWith: result.pathStartsWith },
        },
        data: {
          animeId: anime.id,
        },
      });
      logger.trace(
        `${anime.id} - ${anime.name} 现在有 ${update.count} 个文件.`
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error(error.message);
      } else {
        logger.error(error);
      }
    }
  }

  /**
   * 将当前库中没有归属的文件向父级目录寻找 anime 归属标记
   * @param path
   */
  async markAnimeForBlankFiles(path: string) {
    const allBlank = await usePrisma.libFile.findMany({
      where: {
        libraryId: this.libraryTool.id,
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
        cache.get(file.path) || (await this.reader.readPathRoot(file.path));
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
        logger.debug(`${nodePath.join(file.path, file.name)} 未找到归属.`);
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
