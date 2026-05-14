import { describe, it, expect } from "vitest";
import {
  getIndexInfo,
  queryAnimeByIndex,
} from "../../services/v2/index/index.js";

describe("getIndexInfo", () => {
  it("应返回年份和类型列表", async () => {
    const result = await getIndexInfo();
    expect(result.year).toBeDefined();
    expect(result.type).toBeDefined();
    expect(Array.isArray(result.year)).toBe(true);
    expect(Array.isArray(result.type)).toBe(true);
    expect(result.year.length).toBeGreaterThan(0);
    expect(result.type.length).toBeGreaterThan(0);
  });

  it("年份列表应包含 seed 中的年份", async () => {
    const result = await getIndexInfo();
    expect(result.year).toContain("2026年");
    expect(result.year).toContain("2025年");
  });

  it("类型列表应包含 seed 中的类型", async () => {
    const result = await getIndexInfo();
    expect(result.type).toContain("1月冬");
    expect(result.type).toContain("10月秋");
  });
});

describe("queryAnimeByIndex", () => {
  it("按年份查询应返回匹配结果", async () => {
    const result = await queryAnimeByIndex("2026年", undefined);
    expect(Array.isArray(result)).toBe(true);
    for (const anime of result) {
      expect(anime.year).toBe("2026年");
    }
  });

  it("按类型查询应返回匹配结果", async () => {
    const result = await queryAnimeByIndex(undefined, "1月冬");
    expect(Array.isArray(result)).toBe(true);
    for (const anime of result) {
      expect(anime.type).toBe("1月冬");
    }
  });

  it("空参数应返回全部未删除番剧", async () => {
    const result = await queryAnimeByIndex(undefined, undefined);
    expect(Array.isArray(result)).toBe(true);
    for (const anime of result) {
      expect(anime.deleted).toBe(0);
    }
  });

  it("不匹配的年份应返回空数组", async () => {
    const result = await queryAnimeByIndex("2099年", undefined);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
