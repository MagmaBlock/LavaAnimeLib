import type { FileSystemDriver } from "./types.js";
import { AlistDriver } from "./alist-driver.js";
import type { DriveConfig } from "@lavaanime/shared";

export function createDriver(config: { type: string; config: DriveConfig }): FileSystemDriver {
  switch (config.type) {
    case "alist":
      return new AlistDriver(config.config);
    default:
      throw new Error(`不支持的文件系统类型: ${config.type}`);
  }
}
