import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

try {
  const content = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
} catch {
  /* .env not found, use system env vars */
}

const envSchema = z.object({
  MYSQL_URL: z.string().url().refine(
    (url) => url.startsWith("mysql://"),
    { message: "MYSQL_URL must start with mysql://" }
  ),
  BANGUMI_API_HOST: z.string().url(),
  BANGUMI_IMAGE_HOST: z.string().url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  LOG_DIR: z.string().default("logs"),
  LOG_FILE: z.string().default("app.log"),
  SECURITY_TRUST_PROXY: z.enum(["true", "false"]).transform((v) => v === "true"),
  SECURITY_LOGIN_MAX_TRY: z.string().transform(Number).pipe(z.number().int().positive()),
  SECURITY_BAN_WAIT_MINUTES: z.string().transform(Number).pipe(z.number().int().positive()),
  SECURITY_TOKEN_EXPIRATION_DAYS: z.string().transform(Number).pipe(z.number().int().positive()),
});

function parseMysqlUrl(mysqlUrl: string) {
  const url = new URL(mysqlUrl);
  return {
    host: url.hostname,
    port: Number(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  };
}

const raw = envSchema.parse(process.env);

const config = {
  mysql: parseMysqlUrl(raw.MYSQL_URL),
  bangumi: {
    host: raw.BANGUMI_API_HOST,
  },
  bangumiImage: {
    host: raw.BANGUMI_IMAGE_HOST,
  },
  log: {
    level: raw.LOG_LEVEL,
    dir: raw.LOG_DIR,
    file: raw.LOG_FILE,
  },
  security: {
    trustProxy: raw.SECURITY_TRUST_PROXY,
    loginMaxTry: raw.SECURITY_LOGIN_MAX_TRY,
    banWaitTime: raw.SECURITY_BAN_WAIT_MINUTES,
    tokenExpirationTime: raw.SECURITY_TOKEN_EXPIRATION_DAYS,
  },
};

export default config;
