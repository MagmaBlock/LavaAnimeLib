import type { Logger } from "pino";
import pino from "pino";
import pretty from "pino-pretty";
import { createStream } from "rotating-file-stream";
import path from "node:path";
import config from "../env.js";

let _instance: Logger | null = null;

function padTimePart(value: number, length = 2): string {
  return value.toString().padStart(length, "0");
}

export function formatLogTime(date = new Date()): string {
  const year = date.getFullYear();
  const month = padTimePart(date.getMonth() + 1);
  const day = padTimePart(date.getDate());
  const hour = padTimePart(date.getHours());
  const minute = padTimePart(date.getMinutes());
  const second = padTimePart(date.getSeconds());
  const millisecond = padTimePart(date.getMilliseconds(), 3);
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = padTimePart(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetRemainderMinutes = padTimePart(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond} ${offsetSign}${offsetHours}:${offsetRemainderMinutes}`;
}

function createLogger(): Logger {
  const logDir = path.resolve(config.log.dir);
  const fileStream = createStream(config.log.file, {
    interval: "1d",
    path: logDir,
    compress: "gzip",
    immutable: true,
  });

  return pino(
    {
      level: config.log.level,
      timestamp: () => `,"time":"${formatLogTime()}"`,
    },
    pino.multistream([
      { stream: pretty({ colorize: true, translateTime: false }) },
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
