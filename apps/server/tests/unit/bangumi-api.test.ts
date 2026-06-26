import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("../../common/api-clients/bangumi.js", () => ({
  bangumiAPI: { get: mockGet },
}));

import {
  getBangumiSubjects,
  getBangumiRelations,
  getBangumiCharacters,
} from "../../services/v2/bangumi/api.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getBangumiSubjects", () => {
  it("应返回 subject data", async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: 1, name: "Test Anime", name_cn: "测试番剧" },
    });
    const result = await getBangumiSubjects(1);
    expect(mockGet).toHaveBeenCalledWith("/v0/subjects/1");
    expect(result).toEqual({ id: 1, name: "Test Anime", name_cn: "测试番剧" });
  });

  it("API 错误应向上抛出", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network Error"));
    await expect(getBangumiSubjects(1)).rejects.toThrow("Network Error");
  });
});

describe("getBangumiRelations", () => {
  it("应原样返回上游关联条目", async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: 100, name: "Related A" },
        { id: 200, name: "Related B" },
        { id: 300, name: "Related C" },
      ],
    });
    const result = await getBangumiRelations(1);
    expect(mockGet).toHaveBeenCalledWith("/v0/subjects/1/subjects");
    expect(result).toEqual([
      { id: 100, name: "Related A" },
      { id: 200, name: "Related B" },
      { id: 300, name: "Related C" },
    ]);
  });

  it("空响应时应返回空数组", async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
    });
    const result = await getBangumiRelations(1);
    expect(result).toEqual([]);
  });

  it("API 错误应向上抛出", async () => {
    mockGet.mockRejectedValueOnce(new Error("Not Found"));
    await expect(getBangumiRelations(1)).rejects.toThrow("Not Found");
  });
});

describe("getBangumiCharacters", () => {
  it("应返回 characters data", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ id: 10, name: "Character A" }],
    });
    const result = await getBangumiCharacters(1);
    expect(mockGet).toHaveBeenCalledWith("/v0/subjects/1/characters");
    expect(result).toEqual([{ id: 10, name: "Character A" }]);
  });

  it("API 错误应向上抛出", async () => {
    mockGet.mockRejectedValueOnce(new Error("Timeout"));
    await expect(getBangumiCharacters(1)).rejects.toThrow("Timeout");
  });
});
