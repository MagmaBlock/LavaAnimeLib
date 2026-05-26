import { vi, beforeAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("../common/config.js", async () => {
  const testConfig = await import("../common/config.test.js");
  return { default: testConfig.default };
});

import cache from "../common/cache.js";

let db: Awaited<typeof import("../common/database/connection.js")>["db"] | undefined;
let dbReady = false;

beforeAll(async () => {
  try {
    const connectionModule = await import("../common/database/connection.js");
    db = connectionModule.db;
    dbReady = true;
  } catch {
    console.warn("[tests/setup] 数据库不可用，跳过 seed 数据加载。部分测试可能无法运行。");
    return;
  }

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
});

beforeEach(() => {
  cache.token = {};
  cache.user = {};
  cache.hot = [];
});
