import type { FileSystemDriver } from "./types.js";
import { AlistDriver } from "./alist-driver.js";

interface ConnectionConfig {
  type: string;
  config: unknown;
}

export function createDriver(config: ConnectionConfig): FileSystemDriver {
  const parsedConfig = typeof config.config === "string"
    ? JSON.parse(config.config)
    : config.config;

  switch (config.type) {
    case "alist":
      return new AlistDriver(parsedConfig as ConstructorParameters<typeof AlistDriver>[0]);
    default:
      throw new Error(`不支持的文件系统类型: ${config.type}`);
  }
}
