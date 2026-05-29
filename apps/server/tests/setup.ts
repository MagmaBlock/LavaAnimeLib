import fs from "fs";
import path from "path";
import { beforeAll, beforeEach } from "vitest";

Object.assign(process.env, {
  MYSQL_URL: "mysql://LavaAnimeTest:test_password@localhost:3307/lavaanime_test",
  BANGUMI_API_HOST: "https://api.bgm.tv",
  BANGUMI_IMAGE_HOST: "https://lain.bgm.tv/",
  LOG_LEVEL: "error",
  LOG_DIR: "logs",
  LOG_FILE: "app.log",
  SECURITY_TRUST_PROXY: "true",
  SECURITY_LOGIN_MAX_TRY: "10",
  SECURITY_BAN_WAIT_MINUTES: "1",
  SECURITY_TOKEN_EXPIRATION_DAYS: "30",
});

import cache from "../common/cache.js";

let seeded = false;

beforeAll(async () => {
  let db: Awaited<typeof import("../common/database/connection.js")>["db"];
  try {
    const connectionModule = await import("../common/database/connection.js");
    db = connectionModule.db;
  } catch {
    console.warn("[tests/setup] 数据库不可用，跳过 seed 数据加载。部分测试可能无法运行。");
    return;
  }

  if (seeded) return;

  const { sql } = await import("drizzle-orm");

  const seedPath = path.resolve(import.meta.dirname, "seed.sql");
  const seedSQL = fs.readFileSync(seedPath, "utf-8");

  const statements = seedSQL
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }

  seeded = true;
});

beforeEach(() => {
  cache.token = {};
  cache.user = {};
  cache.hot = [];
});
