import { AnimeCreator } from "~/src/class/anime/creator";
import { AlistLibraryTool } from "~/src/class/library/alist";

export async function main() {
  const library = await usePrisma.library.findFirst({
    where: {
      id: "3A_Xinxiang",
    },
  });

  const libraryTool = new AlistLibraryTool(library);
  // await libraryTool.getScanner().scan("/");
  const result = await libraryTool.getScraper().scrapeLibrary("/");
  // console.log(JSON.stringify(result));
  // await AnimeCreator.applyLibraryScraperResult(result);
}
