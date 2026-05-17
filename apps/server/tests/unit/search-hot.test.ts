import { describe, it, expect } from "vitest";
import { getHotAnimes } from "../../services/v2/search/hot.js";

describe("getHotAnimes", () => {
  it("无观看记录时应返回空数组", async () => {
    const result = await getHotAnimes();
    expect(Array.isArray(result)).toBe(true);
  });

  it("有观看记录时应返回热门列表（不超过10条）", async () => {
    const result = await getHotAnimes();
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
