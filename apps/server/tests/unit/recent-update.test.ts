import { describe, it, expect } from "vitest";
import { getRecentUpdates } from "../../services/v2/anime/recent-update.js";

describe("getRecentUpdates", () => {
  it("应返回最近更新列表", async () => {
    const result = await getRecentUpdates(0, 10, false);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("应包含解析后的番剧信息", async () => {
    const result = await getRecentUpdates(0, 10, false);
    const item = result.find((r: any) => r.animeID === 1);
    expect(item).toBeDefined();
    expect(item.anime).toBeDefined();
    expect(item.anime.title).toBeDefined();
    expect(item.anime.images).toBeDefined();
  });

  it("应包含 parseResult", async () => {
    const result = await getRecentUpdates(0, 10, false);
    for (const item of result) {
      expect(item.parseResult).toBeDefined();
    }
  });

  it("应支持 skip/take 分页", async () => {
    const all = await getRecentUpdates(0, 10, false);
    const page = await getRecentUpdates(0, 1, false);
    expect(page).toHaveLength(1);
  });

  it("ignoreDuplicate 应过滤旧队列消息", async () => {
    const result = await getRecentUpdates(0, 10, true);
    for (const item of result) {
      expect(item.messageSkiped).toBeFalsy();
    }
  });
});
