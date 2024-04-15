import { LibraryScrapeResult } from "../library/scraper/result";

/**
 * 用于创建新番和管理番剧文件列表的工具类
 */
export class AnimeCreator {
  /**
   * 将 LibraryScrapeResult 的结果生效到数据库中
   * @param result 由 LibraryScraper 挂削出的结果
   */
  public static async applyLibraryScraperResult(result: LibraryScrapeResult) {
    const { newAnime, existingAnime } = result;

    // 创建新番
    for (const thisResult of newAnime) {
      try {
        const animeCreate = await usePrisma.anime.create({
          data: {
            name: thisResult.anime.name,
            originalName: thisResult.anime.originalName,
            bdrip: thisResult.anime.bdrip,
            nsfw: thisResult.anime.nsfw,
            platform: thisResult.anime.platform,
            date: thisResult.anime.date,
            releaseYear: thisResult.anime.releaseYear,
            releaseSeason: thisResult.anime.releaseSeason,
            region: thisResult.anime.region,
          },
        });
        logger.info(`创建新番 ${thisResult.anime.name}`);

        // 为新番添加站点链接
        for (const siteLink of thisResult.anime.sites) {
          await usePrisma.anime.update({
            where: { id: animeCreate.id },
            data: {
              sites: {
                connectOrCreate: {
                  where: { siteId_siteType: { ...siteLink } },
                  create: { ...siteLink },
                },
              },
            },
          });
          logger.trace(
            `${thisResult.anime.name} -> ${siteLink.siteType} ${siteLink.siteId}`
          );
        }

        // 为新番添加所有文件
        const { count } = await usePrisma.libFile.updateMany({
          where: { id: { in: thisResult.files.map((file) => file.id) } },
          data: { animeId: animeCreate.id },
        });
        logger.trace(`${thisResult.anime.name} 关联到 ${count} 个文件`);
      } catch (error) {
        logger.error(error, "创建新番时发生错误");
      }
    }
    // 新番创建部分结束

    // 链接老番
    for (const thisResult of existingAnime) {
      try {
        // 为老番添加所有文件
        const { count } = await usePrisma.libFile.updateMany({
          where: { id: { in: thisResult.files.map((file) => file.id) } },
          data: { animeId: thisResult.anime.id },
        });
        logger.trace(`${thisResult.anime.name} 关联到 ${count} 个文件`);
      } catch (error) {
        logger.error(error, "链接老番时发生错误");
      }
    }
    // 老番链接部分结束
  }
}
