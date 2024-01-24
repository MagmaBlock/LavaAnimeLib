import nodePath from "path/posix";
import { LibraryTool } from "./interface";

export class LibraryReader {
  libraryTool: LibraryTool;

  constructor(libraryTool: LibraryTool) {
    this.libraryTool = libraryTool;
  }

  async readPathRoot(path: string) {
    const parsePath = nodePath.parse(path);

    return await usePrisma.libFile.findUnique({
      where: {
        uniqueFileInLib: {
          libraryId: this.libraryTool.id,
          path: parsePath.dir,
          name: parsePath.base,
        },
        removed: false,
      },
    });
  }

  /**
   * 从数据库中查询某个路径下的文件
   */
  async readPath(path: string) {
    path = nodePath.join(path);

    return await usePrisma.libFile.findMany({
      where: {
        libraryId: this.libraryTool.id,
        removed: false,
        path,
      },
    });
  }

  /**
   * 从数据库中查询某个路径下的文件(但仅限没有 anime 归属的)
   */
  async readPathOnlyNullAnime(path: string) {
    path = nodePath.join(path);

    return await usePrisma.libFile.findMany({
      where: {
        libraryId: this.libraryTool.id,
        removed: false,
        path,
        animeId: null,
      },
    });
  }
}
