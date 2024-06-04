import { AnimeInfoSource, EpisodeType } from "@prisma/client";
import { AnimeInfoUpdater } from "./interface";
import {
  BangumiAPI,
  BangumiAPIEpisode,
  BangumiAPIEpisodes,
  BangumiAPISubject,
} from "../../../api/bangumi";
import moment from "moment";

/**
 * 从番组计划获取番剧信息的信息更新器
 */
export class BangumiAnimeInfoUpdater implements AnimeInfoUpdater {
  private bangumiAPI = new BangumiAPI();

  async updateRelationAnimes(bangumiId: string): Promise<void> {
    if (
      bangumiId === undefined ||
      Number(bangumiId) <= 0 ||
      Number.isNaN(Number(bangumiId))
    ) {
      return;
    }

    const { animes } = await usePrisma.animeSiteLink.findFirstOrThrow({
      where: {
        siteType: "Bangumi",
        siteId: bangumiId,
      },
      include: {
        animes: true,
      },
    });

    const bangumiSubject = await this.bangumiAPI.getSubjects(Number(bangumiId));

    const bangumiEpisodes = await this.bangumiAPI.getEpisodes(
      Number(bangumiId)
    );

    for (const anime of animes) {
      // TODO: poster 更新

      // 更新 Anime 主要数据
      await this.updateAnime(anime.id, bangumiSubject);

      // 删除本番剧现存的 Banugmi 标签
      await this.updateAnimeTags(anime.id, bangumiSubject);

      // 更新评分
      await this.updateRating(anime.id, bangumiSubject);

      // TODO: episodes 更新
      await this.updateAnimeEpisodes(anime.id, bangumiEpisodes);
    }

    await this.saveLastUpdate(bangumiId);
  }

  /**
   * 从 Bangumi 获取到的分集信息更新 AnimeEpisode
   * @param animeId
   * @param bangumiEpisodes
   */
  private async updateAnimeEpisodes(
    animeId: number,
    bangumiEpisodes: BangumiAPIEpisodes
  ) {
    for (const bangumiEpisode of bangumiEpisodes.data) {
      const upsert = await usePrisma.animeEpisode.upsert({
        where: {
          animeId_type_episodeDisplay: {
            animeId,
            type: this.bangumiEpisodeTypeToDBType(bangumiEpisode),
            episodeDisplay: bangumiEpisode.sort,
          },
        },
        update: {
          episodeIndex: bangumiEpisode.ep,
          name: bangumiEpisode.name_cn || null,
          originalName: bangumiEpisode.name || null,
          summary: bangumiEpisode.desc || null,
          airDate: bangumiEpisode.airdate || null,
          duration:
            bangumiEpisode.duration_seconds ??
            moment.duration(bangumiEpisode.duration).asSeconds(),
          source: "Bangumi",
        },
        create: {
          episodeDisplay: bangumiEpisode.sort,
          episodeIndex: bangumiEpisode.ep,
          type: this.bangumiEpisodeTypeToDBType(bangumiEpisode),
          name: bangumiEpisode.name_cn || null,
          originalName: bangumiEpisode.name || null,
          summary: bangumiEpisode.desc || null,
          airDate: bangumiEpisode.airdate || null,
          duration:
            bangumiEpisode.duration_seconds ??
            moment.duration(bangumiEpisode.duration).asSeconds(),
          animeId,
          source: "Bangumi",
        },
      });
      logger.trace(
        `已从 ${upsert.source} 更新 animeId ${upsert.animeId} 的 ${upsert.type} 集数 ${upsert.episodeDisplay} 数据.`
      );
    }
  }

  private bangumiEpisodeTypeToDBType(
    bangumiEpisode: BangumiAPIEpisode
  ): EpisodeType {
    if (bangumiEpisode.type === 0) return "Normal";
    if (bangumiEpisode.type === 1) return "SP";
    if (bangumiEpisode.type === 2) return "OP";
    if (bangumiEpisode.type === 3) return "ED";
    return "Other";
  }

  /**
   * 在数据库里更新 AnimeSiteLink 的 lastUpdate 字段
   * @param animeId
   */
  private async saveLastUpdate(animeSiteId: string) {
    await usePrisma.animeSiteLink.update({
      where: {
        siteId_siteType: {
          siteId: animeSiteId,
          siteType: "Bangumi",
        },
      },
      data: {
        lastUpdate: new Date(),
      },
    });
  }

  /**
   * 更新番剧信息
   */
  private async updateAnime(
    animeId: number,
    bangumiSubject: BangumiAPISubject
  ) {
    await usePrisma.anime.update({
      where: {
        id: animeId,
      },
      data: {
        originalName: bangumiSubject.name,
        summary: bangumiSubject.summary,
        platform: bangumiSubject.platform,
        date: moment(bangumiSubject.date).toDate(),
      },
    });

    logger.trace(`从 Bangumi 更新了番剧 ${animeId} 的基础信息.`);
  }

  /**
   * 更新番剧的 Banugmi 标签
   */
  private async updateAnimeTags(
    animeId: number,
    bangumiSubject: BangumiAPISubject
  ) {
    await usePrisma.animeTag.deleteMany({
      where: {
        source: AnimeInfoSource.Bangumi,
        animeId: animeId,
      },
    });

    let tags = bangumiSubject.tags
      // 转为数据库格式
      .map((tag) => {
        return {
          name: tag.name,
          count: tag.count,
          source: AnimeInfoSource.Bangumi,
          animeId: animeId,
        };
      });

    // name 去重合并，因为 mysql 重复约束是忽略大小写的.
    tags.forEach((tag, index, array) => {
      // 找到相同 name 的 tag
      const equalsTag = tags.find((tagFind, indexFind) => {
        if (index === indexFind) return false;
        if (tagFind.count === -1) return false;
        if (tag.name.toLowerCase() === tagFind.name.toLowerCase()) return true;
      });

      if (equalsTag) {
        // 将后面重复的 count 置为 -1.
        equalsTag.count = -1;
        tag.count = tag.count + equalsTag.count;
      }
    });

    tags = tags.filter((tag) => {
      return tag.count !== -1;
    });

    // logger.debug(tags);

    // 添加新的 Banugmi 标签
    await usePrisma.animeTag.createMany({
      data: tags,
    });

    logger.trace(`从 Bangumi 更新了番剧 ${animeId} 的最新标签.`);
  }

  /**
   * 更新番剧的评分
   */
  private async updateRating(
    animeId: number,
    bangumiSubject: BangumiAPISubject
  ) {
    await usePrisma.animeRating.upsert({
      where: {
        animeId_source: {
          animeId: animeId,
          source: AnimeInfoSource.Bangumi,
        },
      },
      update: {
        score: bangumiSubject.rating.score,
        rank: bangumiSubject.rating.rank,
        count: bangumiSubject.rating.total,
      },
      create: {
        score: bangumiSubject.rating.score,
        rank: bangumiSubject.rating.rank,
        count: bangumiSubject.rating.total,
        animeId: animeId,
        source: AnimeInfoSource.Bangumi,
      },
    });

    logger.trace(`更新了番剧 ${animeId} 的最新 Bangumi 评分`);
  }
}