import { Anime, AnimeSiteType, LibFile, Region } from "@prisma/client";

/**
 * 挂削器的结果
 */
export class LibraryScrapeResult {
  newAnime: {
    anime: NewAnime;
    files: LibFile[];
  }[];

  existingAnime: {
    anime: Anime;
    files: LibFile[];
  }[];

  constructor() {
    this.newAnime = [];
    this.existingAnime = [];
  }

  /**
   * 增加新挂削结果
   * @param newAnime
   * @param files
   */
  addNewAnimeFileMap(newAnime: NewAnime, files: LibFile[]) {
    this.newAnime.push({
      anime: newAnime,
      files: files,
    });
  }

  /**
   * 增加已存在的动画的挂削结果
   * @param anime
   * @param files
   */
  addExistingAnimeFileMap(anime: Anime, files: LibFile[]) {
    this.existingAnime.push({
      anime: anime,
      files: files,
    });
  }
}

/**
 * 描述了被刮削后即将被添加入库的 Anime
 */
export interface NewAnime {
  name: string;
  originalName?: string;
  bdrip: boolean;
  nsfw: boolean;
  platform?: string;
  date?: Date;
  releaseYear?: number;
  releaseSeason?: string;
  region: Region;

  sites: {
    siteType: AnimeSiteType;
    siteId: string;
  }[];
}
