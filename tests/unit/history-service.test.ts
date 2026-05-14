import { describe, it, expect, beforeAll } from "vitest";
import { getFormattedPassword } from "../../services/v2/user/password.js";
import { createUser, findUser } from "../../services/v2/user/user.js";
import {
  recordViewHistory,
  getUserViewHistory,
  isNewView,
} from "../../services/v2/anime/history.js";

let userID: number;
const TS = Date.now();

beforeAll(async () => {
  const hash = getFormattedPassword("test_hist");
  await createUser(`hist_ut_${TS}@t.com`, hash, `hist_ut_${TS}`);
  const user = await findUser(`hist_ut_${TS}`);
  userID = user.id;
});

describe("recordViewHistory", () => {
  it("应成功记录观看历史", async () => {
    await recordViewHistory(
      userID, 1, "ep01.mp4", 120, 1800,
      "127.0.0.1", "browser", "1A"
    );
  });

  it("同文件再次上报应覆写（不抛错）", async () => {
    await recordViewHistory(
      userID, 1, "ep01.mp4", 300, 1800,
      "127.0.0.1", "browser", "1A"
    );
  });
});

describe("getUserViewHistory", () => {
  it("应返回用户的观看记录", async () => {
    const result = await getUserViewHistory(userID);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("记录应不包含 userID 和 userIP", async () => {
    const result = await getUserViewHistory(userID);
    for (const record of result) {
      expect(record.userID).toBeUndefined();
      expect(record.userIP).toBeUndefined();
    }
  });

  it("animeID 过滤应只返回指定番剧", async () => {
    await recordViewHistory(
      userID, 2, "ep01_other.mp4", 60, 1200,
      "127.0.0.1", "browser", "1A"
    );
    const result = await getUserViewHistory(userID, 1, 20, 2);
    for (const record of result) {
      expect(record.animeID).toBe(2);
    }
  });

  it("latestOnly 应返回每部番剧的最新记录", async () => {
    const result = await getUserViewHistory(userID, 1, 20, undefined, true);
    expect(Array.isArray(result)).toBe(true);
  });

  it("pageSize 参数应限制结果数量", async () => {
    const result = await getUserViewHistory(userID, 1, 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});

describe("isNewView", () => {
  it("刚上报记录应判定为重复（不是新观看）", async () => {
    const result = await isNewView(userID, 1, "ep01.mp4");
    expect(result).toBe(false);
  });

  it("全新文件应判定为新观看", async () => {
    const result = await isNewView(userID, 1, "nonexistent_ep_xyz.mkv");
    expect(result).toBe(true);
  });
});
