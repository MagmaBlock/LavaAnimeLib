import { AnimeEpisode, EpisodeType, LibFile } from "@prisma/client";
import { parseFileName } from "anime-name-tool";
import nodePath from "path/posix";

export class LibFileEpLinker {
  async connect(libFiles: LibFile[]) {
    let connectResult = {
      totalConnectedCount: 0,
      videoEpisodeNotFound: <LibFile[]>[],
    };

    for (const libFile of libFiles) {
      // 排除没有关联到番剧的文件
      if (!libFile.animeId) continue;
      // 排除目录
      if (libFile.isDirectory) continue;

      const fileNameParsed = parseFileName(libFile.name);

      let maybeEpisodes: AnimeEpisode[];
      let thisFileEpisodetype: EpisodeType;

      // 文件名含集数
      if (fileNameParsed.episode) {
        thisFileEpisodetype = this.getEpisodeType(libFile);
        maybeEpisodes = await this.findEpisodes(
          libFile,
          thisFileEpisodetype,
          fileNameParsed.episode
        );
      }
      // 文件名不含集数
      else {
        if (libFile.type === "Video") {
          thisFileEpisodetype = this.getEpisodeType(libFile);
          if (thisFileEpisodetype === "Normal") {
            maybeEpisodes = await this.findNoEpisodeEpisodes(libFile);
          }
          if (["SP", "OP", "ED"].includes(thisFileEpisodetype)) {
            maybeEpisodes = await this.findEpisodes(
              libFile,
              thisFileEpisodetype,
              1
            );
          }
        }
      }

      // if (maybeEpisodes) {
      //   logger.debug(libFile.name);
      //   logger.debug(
      //     maybeEpisodes.map(
      //       (ep) =>
      //         `${ep.type} ${ep.episodeDisplay}(${ep.episodeIndex}) ${
      //           ep.name ?? ep.originalName ?? ""
      //         }`
      //     )
      //   );
      //   logger.debug("");
      // } else {
      //   logger.debug("No Episodes found:", libFile.path + "/" + libFile.name);
      // }

      // 找到与此文件相匹配的集数
      if (Array.isArray(maybeEpisodes) && maybeEpisodes.length > 0) {
        await usePrisma.libFile.update({
          where: {
            id: libFile.id,
          },
          data: {
            episodes: {
              connect: maybeEpisodes,
            },
          },
        });

        connectResult.totalConnectedCount += maybeEpisodes.length;
      } else {
        if (libFile.type === "Video") {
          connectResult.videoEpisodeNotFound.push(libFile);
        }
      }
    }
    return connectResult;
  }

  /**
   * 剧场版动画、电影通常不在文件名中有集数，因此需要为其匹配可能的集数
   * @param libFile
   */
  async findNoEpisodeEpisodes(libFile: LibFile) {
    const anime = await usePrisma.anime.findFirst({
      where: { id: libFile.animeId },
      include: { episodes: true },
    });

    const normalEpisodes = anime.episodes.filter((ep) => ep.type === "Normal");
    if (normalEpisodes.length === 1) {
      return normalEpisodes;
    }

    // 找不到正片
    if (normalEpisodes.length === 0) {
      const allEpisodes = anime.episodes;
      // 一共就一个 Episode
      if (allEpisodes.length === 1) {
        return allEpisodes;
      }
    }
  }

  /**
   * 根据提供的剧集信息，在数据库中查找相应的剧集记录。
   *
   * @param LibFile 一个包含动画ID的对象，用于指定查询的动画。
   * @param thisFileEpisodetype 指定剧集的类型，例如“正片”或“特别篇”。
   * @param episode 要查询的剧集，可以是单个剧集号、剧集范围（用管道符号分隔）或剧集数组。
   * @returns 返回一个包含剧集记录的数组，如果找不到则返回空数组。
   */
  private async findEpisodes(
    LibFile: LibFile,
    thisFileEpisodetype: EpisodeType,
    episode: string | number | number[]
  ) {
    // 当剧集参数为单个数字时，尝试查找对应的单个剧集记录。
    if (typeof episode === "number") {
      const episodeRecord = await usePrisma.animeEpisode.findFirst({
        where: {
          animeId: LibFile.animeId,
          type: thisFileEpisodetype,
          episodeDisplay: episode,
        },
      });

      if (episodeRecord) return [episodeRecord];

      if (thisFileEpisodetype === "Normal") {
        // 正片情况下，有时候资料站点的集数延续上季，而资源命名却从 1 开始。
        // 因此如果上面的查找找不到，那就再试试从 1 开始的 episodeIndex 模式。
        const episodeRecordIndex = await usePrisma.animeEpisode.findFirst({
          where: {
            animeId: LibFile.animeId,
            type: thisFileEpisodetype,
            episodeIndex: episode,
          },
        });

        if (episodeRecordIndex) return [episodeRecordIndex];
        // thisFileEpisodetype 是通过文件名推断出来的，可能不准确。
        // 有些番剧会在正片完结后再有一些接续正片集数的 SP / OVA / OAD 等。(如 https://bgm.tv/subject/1424)
        // 因此如果从 type: "Normal" 里面找不到，就试着去 SP 里找。
        const episodeRecordSP = await usePrisma.animeEpisode.findFirst({
          where: {
            animeId: LibFile.animeId,
            type: "SP",
            episodeDisplay: episode,
          },
        });

        if (episodeRecordSP) return [episodeRecordSP];
      }
    }
    // 当剧集参数为字符串时，处理包含范围或单个剧集的剧集表达式。
    // 1|25
    // 9.5|21.5
    // 06,07|226,227
    if (typeof episode === "string") {
      // 如果字符串包含管道符号，表示可能有剧集范围。
      if (episode.includes("|")) {
        // 如果字符串还包含逗号，表示每个范围内有起始和结束剧集。
        // 06,07|226,227
        if (episode.includes(",")) {
          // 分割字符串以获取两个范围。
          // A、B 表示两种命名方式
          const [A, B] = episode.split("|");

          // 分割范围以获取起始和结束剧集。
          const [startA, endA] = A.split(",");
          const AResult = await usePrisma.animeEpisode.findMany({
            where: {
              animeId: LibFile.animeId,
              type: thisFileEpisodetype,
              episodeDisplay: {
                gte: parseFloat(startA),
                lte: parseFloat(endA),
              },
            },
          });
          if (AResult.length) return AResult;

          const [startB, endB] = B.split(",");
          const BResult = await usePrisma.animeEpisode.findMany({
            where: {
              animeId: LibFile.animeId,
              type: thisFileEpisodetype,
              episodeDisplay: {
                gte: parseFloat(startB),
                lte: parseFloat(endB),
              },
            },
          });
          if (BResult.length) return BResult;
        }
        // 如果字符串不包含逗号，表示每个范围只有一集。
        // 1|25
        // 9.5|21.5
        else {
          const [A, B] = episode.split("|");
          const AResult = await usePrisma.animeEpisode.findMany({
            where: {
              animeId: LibFile.animeId,
              type: thisFileEpisodetype,
              episodeDisplay: parseFloat(A),
            },
          });
          if (AResult.length) return AResult;

          const BResult = await usePrisma.animeEpisode.findMany({
            where: {
              animeId: LibFile.animeId,
              type: thisFileEpisodetype,
              episodeDisplay: parseFloat(B),
            },
          });
          if (BResult.length) return BResult;
        }
      }
    }
    // 当剧集参数为数组时，查找在这个范围内的所有剧集。
    if (Array.isArray(episode)) {
      const episodeStart = episode[0];
      const episodeEnd = episode[1];
      // 如果起始或结束剧集不是数字，直接返回空数组。
      if (typeof episodeStart !== "number" && typeof episodeEnd !== "number") {
        return [];
      }

      const result = await usePrisma.animeEpisode.findMany({
        where: {
          animeId: LibFile.animeId,
          type: thisFileEpisodetype,
          episodeDisplay: {
            gte: episodeStart,
            lte: episodeEnd,
          },
        },
      });
      if (result.length) return result;
    }
    return [];
  }

  /**
   * 根据源信息判断当前文件的剧集类型。
   *
   * 此方法主要用于分析源信息中的媒体类型标签，以确定文件是普通剧集、特别篇（SP）、片头曲（OP）还是片尾曲（ED）。
   * 它首先假设文件为普通剧集，然后通过检查媒体类型中是否包含特定标签来逐个排除其他类型。
   *
   * @param result 源信息对象，包含媒体类型等数据。
   * @returns 返回剧集类型的枚举值，可能是"Normal"、"SP"、"OP"或"ED"之一。
   */
  private getEpisodeType(libFile: LibFile): EpisodeType {
    if (libFile.name.match(/\b(SP)\d{0,2}\b/)) return "SP";
    if (libFile.name.match(/\b(NCOP)\d{0,2}\b/)) return "OP";
    if (libFile.name.match(/\b(NCED)\d{0,2}\b/)) return "ED";

    const parentDir = nodePath.basename(libFile.path);
    if (parentDir.match(/\b(SPs|SP|Extra)\b/gi)) return "SP";
    if (parentDir.match(/\b(NCOP)\b/gi)) return "OP";
    if (parentDir.match(/\b(NCED)\b/gi)) return "ED";
    if (parentDir.match(/\b(NCOPED)\b/gi)) return "Other";
    if (parentDir.match(/\b(Song|FLAC|Scan|Bonu|CD)(s)?\b/gi)) return "Other";

    // 返回判断出的剧集类型
    return "Normal";
  }
}
