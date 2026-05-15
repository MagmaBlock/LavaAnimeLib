import type { Logger } from "pino";
import pino from "pino";
import pretty from "pino-pretty";
import { createStream } from "rotating-file-stream";
import path from "node:path";
import config from "../config.js";

let _instance: Logger | null = null;

function createLogger(): Logger {
  const logDir = path.resolve(config.log.dir);
  const fileStream = createStream(config.log.file, {
    interval: "1d",
    path: logDir,
    compress: "gzip",
    immutable: true,
  });

  return pino(
    { level: config.log.level },
    pino.multistream([
      { stream: pretty({ colorize: true, translateTime: "h:MM:ss TT" }) },
      { stream: fileStream },
    ])
  );
}

const handler: ProxyHandler<Logger> = {
  get(_, prop) {
    if (!_instance) {
      _instance = createLogger();
    }
    return Reflect.get(_instance as unknown as Record<string | symbol, unknown>, prop);
  },
};

export const log = new Proxy({} as Logger, handler);
