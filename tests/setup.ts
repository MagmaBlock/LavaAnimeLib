import { vi, beforeAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";

vi.mock("../common/config.js", async () => {
  const testConfig = await import("../common/config.test.js");
  return { default: testConfig.default };
});

import { db } from "../common/database/connection.js";
import cache from "../common/cache.js";

beforeAll(async () => {
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
