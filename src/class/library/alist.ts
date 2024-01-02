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

/**
 * Alist 操作器实现
 */
export class AlistLibraryTool implements LibraryTool {
  id: string;
  name: string;
  description: string;
  type: "Alist";
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

    // 从 Alist 获取最新的文件列表
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
        throw new ServiceUnavailableError("Alist 服务异常");
      }
    } catch (error) {
      // Alist 在找不到路径时，不会回复 4xx，而是 200 中的 body 中的 code = 500
      if (error instanceof AxiosError) {
      }
      throw error;
    }

    // 将 Alist 的文件状态应用到数据库
    try {
      // 首先遍历 Alist 的资源，将获取到的文件写入到数据库
      for (let index in alistFiles) {
        let alistFile = alistFiles[index];

        await usePrisma.libFile.upsert({
          where: {
            uniqueFileInLib: {
              name: alistFile.name,
              path: pathPosix.join(this.config.baseDir, path),
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
            path: pathPosix.join(this.config.baseDir, path),
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

    // 将更新后的 DB 记录和 Alist 中的进行对比，若文件不存在，则会将文件标记为 "removed"
    try {
      inDBLibFiles = await usePrisma.libFile.findMany({
        where: {
          libraryId: this.id,
          path: pathPosix.join(this.config.baseDir, path),
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
        }
      }
    } catch (error) {
      throw error;
    }

    const result = await usePrisma.libFile.findMany({
      where: {
        libraryId: this.id,
        path: pathPosix.join(this.config.baseDir, path),
        removed: false,
      },
    });

    return result;
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
