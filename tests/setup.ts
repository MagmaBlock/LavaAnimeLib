import { vi, beforeAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("../common/config.js", async () => {
  const testConfig = await import("../common/config.test.js");
  return { default: testConfig.default };
});

import { promiseDB } from "../common/database/connection.js";
import cache from "../common/cache.js";

beforeAll(async () => {
  // 清空旧数据避免重复插入
  const tables = [
    "upload_message", "view_history", "views", "follow", "token",
    "invite_code", "settings", "bangumi_data", "anime", "user",
  ];
  for (const table of tables) {
    await promiseDB.query(`DELETE FROM \`${table}\``);
  }

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
    await promiseDB.query(statement);
  }
});

beforeEach(() => {
  cache.token = {};
  cache.user = {};
  cache.hot = [];
});
