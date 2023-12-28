import { LibFile, Library } from "@prisma/client";

export interface LibraryTool extends Library {
  /**
   * 实时扫描一个路径，会将其内容存储至数据库并返回相关 LibFile
   * @param path
   */
  readList(path: string): Promise<LibFile[]>;
}
