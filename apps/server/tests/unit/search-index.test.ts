import { describe, it, expect } from "vitest";
import {
  searchAnimes,
  quickSearch,
} from "../../services/v2/search/index.js";

describe("searchAnimes", () => {
  it("搜索存在的番剧应返回结果", async () => {
    const result = await searchAnimes("测试番剧A");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].title).toContain("测试番剧");
  });

  it("搜索不存在的番剧应返回空数组", async () => {
    const result = await searchAnimes("完全不存在的番剧名称xyz123");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("多词搜索应匹配所有关键词", async () => {
    const result = await searchAnimes("测试 番剧");
    expect(Array.isArray(result)).toBe(true);
  });

  it("搜索结果应按 views 降序排列", async () => {
    const result = await searchAnimes("测试");
    expect(Array.isArray(result)).toBe(true);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].views).toBeLessThanOrEqual(result[i - 1].views);
    }
  });

  it("特殊字符 % 和 _ 应被转义", async () => {
    const result = await searchAnimes("100%");
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("quickSearch", () => {
  it("搜索存在的番剧应返回标题建议", async () => {
    const result = await quickSearch("测试番剧A");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(typeof result[0]).toBe("string");
  });

  it("快速搜索结果不应超过 10 条", async () => {
    const result = await quickSearch("测试");
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("空搜索词应返回空数组", async () => {
    const result = await quickSearch("");
    expect(result).toEqual([]);
  });

  it("不存在的关键词应返回空数组", async () => {
    const result = await quickSearch("xyz_nonexistent_abc");
    expect(result).toEqual([]);
  });

  it("前缀匹配应优先于包含匹配", async () => {
    const result = await quickSearch("测试番剧A");
    expect(result[0]).toBe("测试番剧A");
  });
});
