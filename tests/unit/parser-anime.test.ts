import { describe, it, expect } from "vitest";
import { parseAnime } from "../../services/v2/parser/anime.js";
import { promiseDB } from "../../common/database/connection.js";

describe("parseAnime", () => {
  it("有 bgmID 的番剧应包含 images 和 index", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id = 1"
    );
    const result = await parseAnime(rows[0]);
    expect(result[0].id).toBe(1);
    expect(result[0].images).toBeDefined();
    expect(result[0].images.large).toBeTruthy();
    expect(result[0].images.poster).toBeTruthy();
    expect(result[0].index.year).toBe("2026年");
    expect(result[0].index.type).toBe("1月冬");
    expect(result[0].deleted).toBe(false);
  });

  it("没有 bgmID 的番剧应使用 poster 填充 images", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id = 8"
    );
    const result = await parseAnime(rows[0]);
    expect(result[0].id).toBe(8);
    expect(result[0].images.small).toBe("https://example.com/poster_h.jpg");
    expect(result[0].images.large).toBe("https://example.com/poster_h.jpg");
    expect(result[0].images.poster).toBe("https://example.com/poster_h.jpg");
    expect(result[0].bgmID).toBeUndefined();
  });

  it("应从 title 中移除 [BDRip] 标签", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id = 5"
    );
    const result = await parseAnime(rows[0]);
    expect(result[0].title).not.toMatch(/\[BDRip\]/i);
    expect(result[0].type.bdrip).toBe(true);
  });

  it("应从 title 中移除 [NSFW] 标签", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id = 6"
    );
    const result = await parseAnime(rows[0]);
    expect(result[0].title).not.toMatch(/\[NSFW\]/i);
    expect(result[0].type.nsfw).toBe(true);
  });

  it("应正确处理组合标签 [BDRip][NSFW]", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id = 7"
    );
    const result = await parseAnime(rows[0]);
    expect(result[0].title).not.toMatch(/\[BDRip\]|\[NSFW\]/i);
    expect(result[0].type.bdrip).toBe(true);
    expect(result[0].type.nsfw).toBe(true);
  });

  it("full=true 应返回 subjects 和 relations 和 characters", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id = 1"
    );
    const result = await parseAnime(rows[0], true);
    expect(result[0].title).toBeDefined();
    expect(result[0].relations).toBeDefined();
    expect(Array.isArray(result[0].relations)).toBe(true);
    expect(result[0].characters).toBeDefined();
  });

  it("输入原始数据数组应返回等长结果", async () => {
    const [rows] = await promiseDB.query(
      "SELECT * FROM anime WHERE id IN (1, 2)"
    );
    const result = await parseAnime(rows);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("空数组应返回空数组", async () => {
    const result = await parseAnime([]);
    expect(result).toEqual([]);
  });

  it("null/undefined 应抛错", async () => {
    await expect(parseAnime(null as any)).rejects.toThrow();
    await expect(parseAnime(undefined as any)).rejects.toThrow();
  });
});
