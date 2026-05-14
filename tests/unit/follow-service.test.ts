import { describe, it, expect, beforeAll } from "vitest";
import {
  editAnimeFollow,
  getAnimeFollowInfo,
  getAnimeFollowList,
  getAnimeFollowTotal,
} from "../../services/v2/anime/follow.js";
import { getFormattedPassword } from "../../services/v2/user/password.js";
import { createUser } from "../../services/v2/user/user.js";

let userID: number;
const TS = Date.now();

beforeAll(async () => {
  const hash = getFormattedPassword("test_follow");
  await createUser(`follow_ut_${TS}@t.com`, hash, `follow_ut_${TS}`);
  const { findUser } = await import("../../services/v2/user/user.js");
  const user = await findUser(`follow_ut_${TS}`);
  userID = user.id;
});

describe("editAnimeFollow", () => {
  it("添加追番应返回 status", async () => {
    const result = await editAnimeFollow(userID, 1, 1, false);
    expect(result).toEqual({ status: 1 });
  });

  it("再次添加相同追番应幂等", async () => {
    const result = await editAnimeFollow(userID, 1, 1, false);
    expect(result).toEqual({ status: 1 });
  });

  it("更新追番状态应返回新状态", async () => {
    const result = await editAnimeFollow(userID, 1, 2, false);
    expect(result).toEqual({ status: 2 });
  });

  it("添加多部追番", async () => {
    await editAnimeFollow(userID, 2, 1, false);
    await editAnimeFollow(userID, 3, 0, false);
  });

  it("移除追番应返回 removed", async () => {
    const result = await editAnimeFollow(userID, 1, 1, true);
    expect(result).toEqual({ removed: true });
  });
});

describe("getAnimeFollowInfo", () => {
  it("已追番的番剧应返回 status", async () => {
    await editAnimeFollow(userID, 1, 1, false);
    const result = await getAnimeFollowInfo(userID, 1);
    expect(result.status).toBe(1);
    expect(result.editTime).toBeGreaterThan(0);
  });

  it("未追番的番剧应返回 status=-1", async () => {
    const result = await getAnimeFollowInfo(userID, 999);
    expect(result.status).toBe(-1);
  });
});

describe("getAnimeFollowList", () => {
  it("应返回指定状态的追番列表", async () => {
    const result = await getAnimeFollowList(userID, [1], 1, 10);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].status).toBe(1);
    expect(result[0].animeID).toBeDefined();
  });

  it("空状态列表应返回空数组", async () => {
    const result = await getAnimeFollowList(userID, [99], 1, 10);
    expect(result).toEqual([]);
  });
});

describe("getAnimeFollowTotal", () => {
  it("应返回三种状态的统计", async () => {
    const result = await getAnimeFollowTotal(userID);
    expect(result).toHaveProperty("0");
    expect(result).toHaveProperty("1");
    expect(result).toHaveProperty("2");
    expect(typeof result[0]).toBe("number");
    expect(typeof result[1]).toBe("number");
    expect(typeof result[2]).toBe("number");
  });
});
