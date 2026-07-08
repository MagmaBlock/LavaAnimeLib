import { describe, it, expect } from "vitest";
import {
  getAnimeAdmin,
  updateAnime,
  listAnimeAdmin,
} from "../../services/v2/admin/anime.js";

describe("getAnimeAdmin", () => {
  it("按 laID 查询存在行, 返回全部可编辑字段", async () => {
    const row = await getAnimeAdmin(1);
    expect(row?.id).toBe(1);
    expect(row).toHaveProperty("name");
    expect(row).toHaveProperty("year");
    expect(row).toHaveProperty("type");
    expect(row).toHaveProperty("bgmid");
    expect(row).toHaveProperty("nsfw");
    expect(row).toHaveProperty("title");
    expect(row).toHaveProperty("deleted");
    expect(row).toHaveProperty("poster");
    expect(row).toHaveProperty("episode_start");
    expect([0, 1]).toContain(row?.episode_start_manual);
  });

  it("不存在的 laID 返回 null", async () => {
    expect(await getAnimeAdmin(99999)).toBeNull();
  });
});

describe("updateAnime", () => {
  it("laID 不存在时抛出 \"番剧不存在\"", async () => {
    await expect(updateAnime(99999, { name: "x" })).rejects.toThrow("番剧不存在");
  });

  it("更新单个字段 (name) 后返回刷新行", async () => {
    const before = await getAnimeAdmin(1);
    const original = before?.name;
    const row = await updateAnime(1, { name: "测试改名" });
    expect(row.name).toBe("测试改名");
    // 其余字段保持不变
    expect(row.year).toBe(before?.year);
    // 恢复
    await updateAnime(1, { name: original! });
  });

  it("多字段同时更新 (year/type/nsfw)", async () => {
    const before = await getAnimeAdmin(2);
    const row = await updateAnime(2, {
      year: "2099",
      type: "OVA",
      nsfw: 1,
    });
    expect(row.year).toBe("2099");
    expect(row.type).toBe("OVA");
    expect(row.nsfw).toBe(1);
    // 恢复
    await updateAnime(2, {
      year: before!.year,
      type: before!.type,
      nsfw: (before!.nsfw as 0 | 1),
    });
  });

  it("bgmid / title / poster 可置空", async () => {
    const before = await getAnimeAdmin(3);
    const row = await updateAnime(3, {
      bgmid: null,
      title: null,
      poster: null,
    });
    expect(row.bgmid).toBeNull();
    expect(row.title).toBeNull();
    expect(row.poster).toBeNull();
    // 恢复
    await updateAnime(3, {
      bgmid: before!.bgmid,
      title: before!.title,
      poster: before!.poster,
    });
  });

  it("deleted 可切换为 1 再恢复", async () => {
    const before = await getAnimeAdmin(4);
    const row = await updateAnime(4, { deleted: 1 });
    expect(row.deleted).toBe(1);
    await updateAnime(4, { deleted: (before!.deleted as 0 | 1) });
  });

  it("views 可手动修正并恢复", async () => {
    const before = await getAnimeAdmin(1);
    const original = before?.views ?? 0;
    const row = await updateAnime(1, { views: 99999 });
    expect(row.views).toBe(99999);
    await updateAnime(1, { views: original });
  });
});

describe("listAnimeAdmin", () => {
  it("分页返回单页与总数", async () => {
    const { list, total } = await listAnimeAdmin({ page: 1, pageSize: 1 });
    expect(list).toHaveLength(1);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it("纯数字 search 按 laID 精确匹配", async () => {
    const { list, total } = await listAnimeAdmin({ page: 1, pageSize: 100, search: "1" });
    expect(total).toBeGreaterThanOrEqual(1);
    expect(list.every((r) => r.id === 1 || r.bgmid?.includes("1") || r.name.includes("1"))).toBe(true);
  });

  it("文字 search 按 name/title/bgmid 模糊匹配", async () => {
    const all = await listAnimeAdmin({ page: 1, pageSize: 100 });
    const target = all.list[0];
    const { list } = await listAnimeAdmin({ page: 1, pageSize: 100, search: target.name });
    expect(list.some((r) => r.id === target.id)).toBe(true);
  });

  it("deleted=0 仅返回有效条目, deleted=1 仅返回已删除条目", async () => {
    const onlyValid = await listAnimeAdmin({ page: 1, pageSize: 100, deleted: 0 });
    expect(onlyValid.list.every((r) => r.deleted === 0)).toBe(true);

    const onlyDeleted = await listAnimeAdmin({ page: 1, pageSize: 100, deleted: 1 });
    expect(onlyDeleted.list.every((r) => r.deleted === 1)).toBe(true);
  });
});
