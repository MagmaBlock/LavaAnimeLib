import { describe, it, expect } from "vitest";
import { db } from "../../common/database/connection.js";
import { anime } from "../../common/database/schema/anime.js";
import { eq } from "drizzle-orm";
import {
  setAnimeEpisodeStart,
  getAnimeEpisodeStartAdmin,
} from "../../services/v2/admin/anime.js";
import { backfillEpisodeStart } from "../../services/v2/bangumi/episode-start.js";

async function readRow(id: number) {
  const [row] = await db
    .select({
      id: anime.id,
      bgmid: anime.bgmid,
      episode_start: anime.episode_start,
      episode_start_manual: anime.episode_start_manual,
    })
    .from(anime)
    .where(eq(anime.id, id))
    .limit(1);
  return row;
}

describe("setAnimeEpisodeStart", () => {
  it("laID 不存在时抛出 \"番剧不存在\"", async () => {
    await expect(setAnimeEpisodeStart(99999, true, 13)).rejects.toThrow(
      "番剧不存在"
    );
    await expect(setAnimeEpisodeStart(99999, false)).rejects.toThrow(
      "番剧不存在"
    );
  });

  it("manual=true 写入覆盖值并置 manual=1", async () => {
    const result = await setAnimeEpisodeStart(1, true, 13);
    expect(result).toBe(13);
    const row = await readRow(1);
    expect(row?.episode_start).toBe(13);
    expect(row?.episode_start_manual).toBe(1);
  });

  it("manual=true 但未提供 episode_start 应抛错", async () => {
    await expect(setAnimeEpisodeStart(1, true, undefined)).rejects.toThrow();
    await expect(setAnimeEpisodeStart(1, true, null)).rejects.toThrow();
    await expect(setAnimeEpisodeStart(1, true, 0)).rejects.toThrow();
  });

  it("manual=false 恢复 auto: 置 manual=0 并立即重算回填", async () => {
    // 先设置手动覆盖
    await setAnimeEpisodeStart(2, true, 25);
    const afterManual = await readRow(2);
    expect(afterManual?.episode_start_manual).toBe(1);
    expect(afterManual?.episode_start).toBe(25);

    // 恢复 auto (bgmid 234567 无前传/无 episode, computeEpisodeStart 返回 1)
    const result = await setAnimeEpisodeStart(2, false);
    expect(result).toBe(1);
    const row = await readRow(2);
    expect(row?.episode_start_manual).toBe(0);
    expect(row?.episode_start).toBe(1);
  });

  it("manual=false 对无 bgmid 的番剧: episode_start 置 null", async () => {
    // laID=8 在 seed 中 bgmid 为 NULL
    const result = await setAnimeEpisodeStart(8, false);
    expect(result).toBeNull();
    const row = await readRow(8);
    expect(row?.episode_start_manual).toBe(0);
    expect(row?.episode_start).toBeNull();
  });
});

describe("backfillEpisodeStart — manual flag 隔离", () => {
  it("手动覆盖 (manual=1) 的行不应被 backfill 改写", async () => {
    await setAnimeEpisodeStart(3, true, 99);
    const before = await readRow(3);
    expect(before?.episode_start).toBe(99);
    expect(before?.episode_start_manual).toBe(1);

    await backfillEpisodeStart(345678);
    const after = await readRow(3);
    expect(after?.episode_start).toBe(99);
    expect(after?.episode_start_manual).toBe(1);
  });

  it("auto (manual=0) 的行每次 backfill 都会覆盖重算", async () => {
    // 把 episode_start 设成一个错误值, manual 仍为 0, backfill 应纠正
    await db
      .update(anime)
      .set({ episode_start: 777, episode_start_manual: 0 })
      .where(eq(anime.id, 1));
    await backfillEpisodeStart(123456);
    const row = await readRow(1);
    expect(row?.episode_start_manual).toBe(0);
    expect(row?.episode_start).not.toBe(777);
  });
});

describe("getAnimeEpisodeStartAdmin", () => {
  it("按 laID 查询存在行", async () => {
    const row = await getAnimeEpisodeStartAdmin(1);
    expect(row?.id).toBe(1);
    expect(row?.name).toBeDefined();
    expect(row).toHaveProperty("episode_start");
    expect([0, 1]).toContain(row?.episode_start_manual);
  });

  it("不存在的 laID 返回 null", async () => {
    expect(await getAnimeEpisodeStartAdmin(99999)).toBeNull();
  });
});