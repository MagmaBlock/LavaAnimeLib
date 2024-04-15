import { LavaAnimeLibV2LibraryScraper } from "./v2";
import type { LibraryTool } from "../interface";
import { LibraryScrapeResult } from "./result";

/**
 * 挂削器
 * 本接口定义了一种挂削器，挂削器会按照一定的规范来根据数据库内记录的 LibFile 进行挂削
 */
export interface LibraryScraper {
  libraryTool: LibraryTool;

  /**
   * 对指定路径开始的所有文件/文件夹进行挂削
   * 返回挂削结果集 (LibraryScraperResult)
   */
  scrapeLibrary(pathStartsWith: string): Promise<LibraryScrapeResult>;
}

/**
 * 自动根据 LibraryTool 的 structure 字段获取相应挂削器
 * @param libraryTool
 * @returns
 */
export function scraperFactory(libraryTool: LibraryTool): LibraryScraper {
  if (libraryTool.library.structure === "LavaAnimeLibV2") {
    return new LavaAnimeLibV2LibraryScraper(libraryTool);
  }
}
