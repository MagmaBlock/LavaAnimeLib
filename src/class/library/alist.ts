import {
  InternalServerError,
  LibraryNotConfiguredError,
  NotFoundError,
  ServiceUnavailableError,
} from "../error/error";
import { LibFile, Library } from "@prisma/client";
import { LibraryTool } from "./interface";
import { posix as pathPosix } from "path";
import axios, { AxiosError } from "axios";
import { LibraryScanner } from "./scanner";
import type { LibraryScraper } from "./scraper/interface";
import { getScraper } from "./scraper/interface";
import { LibraryReader } from "./reader";

/**
 * Alist 操作器实现
 */
export class AlistLibraryTool implements LibraryTool {
  id: string;
  name: string;
  description: string;
  type: "Alist";
  structure: Library["structure"];
  noNSFW: boolean;
  noDownload: boolean;
  config: AlistLibraryConfig;

  constructor(library: Library) {
    if (library.type !== "Alist") {
      throw new InternalServerError(
        "构造 AlistLibrary 时的 Library 对象的 type 应该是 Alist"
      );
    }
    this.id = library.id;
    this.name = library.name;
    this.description = library.description;
    this.type = library.type;
    this.structure = library.structure;
    this.noNSFW = library.noNSFW;
    this.noDownload = library.noDownload;
    this.config = library.config as AlistLibraryConfig;
    if (
      typeof this.config?.baseDir !== "string" ||
      typeof this.config?.host !== "string" ||
      typeof this.config?.password !== "string"
    ) {
      throw new LibraryNotConfiguredError(`资源库 ${library.id} 未正确配置`);
    }
    return this;
  }

  /**
   * 从 Alist 刷新最新的文件记录到数据库, 并返回最新的 LibFile 列表
   * @param path
   * @returns
   */
  async readList(path: string): Promise<LibFile[]> {
    let alistFiles: AlistAPIFile[] = null;
    let inDBLibFiles: LibFile[] = null;

    /**
     * 以下块：从 Alist 获取最新的文件列表，存入 alistFiles
     * 若失败将掷出错误
     */
    try {
      const listGet = await axios.post(
        "/api/fs/list",
        {
          path: pathPosix.join(this.config.baseDir, path),
          password: this.config.password,
        },
        {
          baseURL: this.config.host,
        }
      );

      // 成功且有文件
      if (
        listGet.data?.code === 200 &&
        Array.isArray(listGet.data.data?.content)
      ) {
        alistFiles = listGet.data.data?.content;
      }

      // 成功但为空
      if (listGet.data?.code === 200 && listGet.data.data?.content === null) {
        alistFiles = [];
      }

      // 找不到文件夹
      if (
        listGet.data?.code === 500 &&
        listGet.data?.message.match("not found")
      ) {
        throw new NotFoundError(listGet.data.message);
      }

      // 其他意外情况
      if (!Array.isArray(alistFiles)) {
        logger.error("Alist 返回意外结果:", listGet.data);
        throw new ServiceUnavailableError("Alist 服务异常");
      }
    } catch (error) {
      // Alist 在找不到路径时，不会回复 4xx，而是 200 中的 body 中的 code = 500
      if (error instanceof AxiosError) {
        logger.error("Alist 请求失败:", error.message);
      }
      throw error;
    }

    /**
     * 以下块：遍历 alistFiles，将其插入或更新到数据库
     */
    try {
      // 首先遍历 Alist 的资源，将获取到的文件写入到数据库
      for (let index in alistFiles) {
        let alistFile = alistFiles[index];

        await usePrisma.libFile.upsert({
          where: {
            uniqueFileInLib: {
              name: alistFile.name,
              path,
              libraryId: this.id,
            },
          },
          update: {
            // TODO: type 的判断
            isDirectory: alistFile.is_dir,
            size: alistFile.size, // 只为文件标记尺寸
            removed: false,
            lastFoundAt: new Date(),
          },
          create: {
            libraryId: this.id,
            path, // 数据库内存储的应是不含存储库前缀的路径
            name: alistFile.name,
            isDirectory: alistFile.is_dir,
            size: alistFile.size, // 只为文件标记尺寸
            removed: false,
            lastFoundAt: new Date(),
          },
        });
      }
    } catch (error) {
      throw error;
    }

    /**
     * 以下块：将基于 Alist 更新后的数据库记录和 Alist 中的进行对比
     * 若此 path 下的文件(夹)不存在，则会将文件标记为 "removed"
     *
     * P.S. 这里只能删除到调用此函数时传入的 path 的子文件、子文件夹
     *      若数据库中包含有上级目录已经被删除的文件(夹)，则不是在这里删除的。
     *      (是在 LibraryScanner.scan() 完成的)
     */
    try {
      inDBLibFiles = await usePrisma.libFile.findMany({
        where: {
          libraryId: this.id,
          path,
          removed: false,
        },
      });

      // 遍历数据库中当前库路径中所有未删除的文件
      for (const dbFile of inDBLibFiles) {
        // 在 Alist 中查找此文件
        const thisFileInAlist = alistFiles.find(
          (alistFile) => alistFile.name === dbFile.name
        );

        // 如果此 DB 的文件在 Alist 中不存在，将文件标记为 "removed"
        if (thisFileInAlist === undefined) {
          await usePrisma.libFile.update({
            where: {
              uniqueFileInLib: {
                libraryId: dbFile.libraryId,
                path: dbFile.path,
                name: dbFile.name,
              },
            },
            data: {
              removed: true,
            },
          });
          logger.trace(
            `${this.name}(${this.id}) 删除 ${dbFile.path}${dbFile.name}`
          );
        }
      }
    } catch (error) {
      throw error;
    }

    const result = await usePrisma.libFile.findMany({
      where: {
        libraryId: this.id,
        path,
        removed: false,
      },
    });

    return result;
  }

  getScanner(): LibraryScanner {
    return new LibraryScanner(this);
  }

  getScraper(): LibraryScraper {
    return getScraper(this);
  }

  getReader(): LibraryReader {
    return new LibraryReader(this);
  }
}

export type AlistLibraryConfig = {
  host: string;
  password: string;
  baseDir: string;
};

export type AlistAPIFile = {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  created: string;
  sign: string;
  thumb: string;
  type: number;
  hashinfo: string;
  hash_info: object;
};
