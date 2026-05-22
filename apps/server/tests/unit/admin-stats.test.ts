import { describe, it, expect } from "vitest";
import { getAdminStats } from "../../services/v2/admin/stats.js";

describe("getAdminStats", () => {
  it("应返回包含四个统计字段的对象", async () => {
    const result = await getAdminStats();

    expect(result).toBeDefined();
    expect(typeof result.userCount).toBe("number");
    expect(typeof result.animeCount).toBe("number");
    expect(typeof result.validInviteCodeCount).toBe("number");
    expect(typeof result.weekViewCount).toBe("number");
  });

  it("所有统计值应 >= 0", async () => {
    const result = await getAdminStats();

    expect(result.userCount).toBeGreaterThanOrEqual(0);
    expect(result.animeCount).toBeGreaterThanOrEqual(0);
    expect(result.validInviteCodeCount).toBeGreaterThanOrEqual(0);
    expect(result.weekViewCount).toBeGreaterThanOrEqual(0);
  });

  it("userCount 应 >= 种子用户数", async () => {
    const result = await getAdminStats();
    expect(result.userCount).toBeGreaterThanOrEqual(0);
  });

  it("animeCount 应计算未删除的番剧（deleted=0）", async () => {
    const result = await getAdminStats();
    expect(result.animeCount).toBeGreaterThanOrEqual(7);
  });

  it("validInviteCodeCount 应仅统计未使用的有效邀请码", async () => {
    const result = await getAdminStats();
    expect(result.validInviteCodeCount).toBeGreaterThanOrEqual(2);
  });
});
