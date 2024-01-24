import { LavaAnimeLibV2LibraryScraper } from "./v2";
import type { LibraryTool } from "../interface";

export interface LibraryScraper {
  libraryTool: LibraryTool;

  /**
   * 进行挂削
   */
  scrapeLibrary(): Promise<void>;
}

/**
 * 根据 structure 字段获取挂削器
 * @param libraryTool
 * @returns
 */
export function getScraper(libraryTool: LibraryTool): LibraryScraper {
  if (libraryTool.structure === "LavaAnimeLibV2") {
    return new LavaAnimeLibV2LibraryScraper(libraryTool);
  }
}
