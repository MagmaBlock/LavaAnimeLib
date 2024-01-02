import { LibraryTool } from "./interface";
import pathTool from "path/posix";

/**
 * 操纵 LibraryTool 类对资源库存储器进行扫描
 */
export class LibraryScanner {
  libraryTool: LibraryTool;

  constructor(libraryTool: LibraryTool) {
    this.libraryTool = libraryTool;
  }

  async scanLikeATree(rootPath: string) {
    let root = await this.libraryTool.readList(rootPath);

    for (const child of root) {
      // 跳过文件
      if (child.isDirectory === false) continue;
      const thisChildPath = pathTool.join(rootPath, child.name);
      console.log(thisChildPath);
      await this.scanLikeATree(thisChildPath);
    }
  }
}
