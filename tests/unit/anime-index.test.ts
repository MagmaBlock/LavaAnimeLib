import { describe, it, expect } from "vitest";
import {
  getAnimeByID,
  getAnimesByID,
  getAnimesByBgmID,
} from "../../services/v2/anime/index.js";

describe("getAnimeByID", () => {
  it("存在 ID 应返回番剧数据", async () => {
    const anime = await getAnimeByID(1);
    expect(anime.id).toBe(1);
    expect(anime.title).toBe("测试番剧A");
    expect(anime.deleted).toBe(false);
    expect(anime.index).toBeDefined();
    expect(anime.images).toBeDefined();
  });

  it("不存在的 ID 应返回已失效标记", async () => {
    const anime = await getAnimeByID(9999);
    expect(anime.deleted).toBe(true);
    expect(anime.title).toBe("已失效的番剧");
  });

  it("已删除的番剧应返回已失效标记", async () => {
    const anime = await getAnimeByID(4);
    expect(anime.deleted).toBe(true);
  });

  it("非数字参数应抛错", async () => {
    await expect(getAnimeByID("abc" as any)).rejects.toThrow();
  });

  it("full=true 应返回完整数据", async () => {
    const anime = await getAnimeByID(1, true);
    expect(anime.type).toBeDefined();
    expect(anime.images).toBeDefined();
  });
});

describe("getAnimesByID (batch)", () => {
  it("应返回多个番剧", async () => {
    const result = await getAnimesByID([1, 2, 3]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });
});

describe("getAnimesByBgmID", () => {
  it("存在的 bgmID 应返回数组", async () => {
    const result = await getAnimesByBgmID(123456);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].bgmID).toBe(123456);
  });

  it("不存在的 bgmID 应返回空数组", async () => {
    const result = await getAnimesByBgmID(999999);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("非法 bgmID 应返回空数组", async () => {
    const result = await getAnimesByBgmID(0);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("非数字 bgmID 应抛错", async () => {
    await expect(getAnimesByBgmID("abc" as any)).rejects.toThrow();
  });
});
