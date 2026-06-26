import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, makeMockChain, mockLogger, mockGetSiteSetting, mockSetSiteSetting, mockGetSubjects, mockGetRelations, mockGetCharacters } = vi.hoisted(() => {
  function makeMockChain(result: unknown = undefined) {
    const chain: Record<string, ReturnType<typeof vi.fn>> & { then: ReturnType<typeof vi.fn> } = {
      then: vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)),
    };
    ["from", "where", "leftJoin", "groupBy", "orderBy", "limit", "offset", "values", "set", "onDuplicateKeyUpdate", "$returningId"].forEach((name) => {
      chain[name] = vi.fn(() => chain);
    });
    return chain;
  }

  return {
    mockDb: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
    makeMockChain,
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    mockGetSiteSetting: vi.fn(),
    mockSetSiteSetting: vi.fn(),
    mockGetSubjects: vi.fn(),
    mockGetRelations: vi.fn(),
    mockGetCharacters: vi.fn(),
  };
});

vi.mock("../../common/database/connection.js", () => ({ db: mockDb }));
vi.mock("../../common/tools/logger.js", () => ({ log: mockLogger }));
vi.mock("../../services/v2/site/setting.js", () => ({ getSiteSetting: mockGetSiteSetting, setSiteSetting: mockSetSiteSetting }));
vi.mock("../../services/v2/bangumi/api.js", () => ({ getBangumiSubjects: mockGetSubjects, getBangumiRelations: mockGetRelations, getBangumiCharacters: mockGetCharacters }));
vi.mock("../../services/v2/bangumi/sync.js", () => ({ syncAll: vi.fn().mockResolvedValue(undefined) }));

import {
  getBangumiCacheSettings,
  updateBangumiCacheSettings,
  refreshBangumiCache,
  refreshExpiredBangumiCaches,
  ensureStructuredData,
  listBangumiCaches,
  BANGUMI_CACHE_SETTINGS_KEY,
} from "../../services/v2/bangumi/cache.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(makeMockChain([]));
  mockDb.insert.mockReturnValue(makeMockChain());
  mockDb.update.mockReturnValue(makeMockChain());
  mockGetSiteSetting.mockReset();
  mockSetSiteSetting.mockReset();
  mockGetSubjects.mockReset();
  mockGetSubjects.mockResolvedValue({ id: 1, images: {} });
  mockGetRelations.mockReset();
  mockGetRelations.mockResolvedValue([]);
  mockGetCharacters.mockReset();
  mockGetCharacters.mockResolvedValue([]);
});

describe("getBangumiCacheSettings", () => {
  it("site setting 不存在时应返回默认值", async () => {
    mockGetSiteSetting.mockResolvedValueOnce(null);
    const settings = await getBangumiCacheSettings();
    expect(settings).toEqual({ autoUpdateEnabled: true, expireHours: 168 });
    expect(mockGetSiteSetting).toHaveBeenCalledWith(BANGUMI_CACHE_SETTINGS_KEY);
  });

  it("site setting 部分存在时应合并默认值", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ expireHours: 24 });
    const settings = await getBangumiCacheSettings();
    expect(settings).toEqual({ autoUpdateEnabled: true, expireHours: 24 });
  });

  it("应覆盖无效的 expireHours 为默认值", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ expireHours: 0 });
    const settings = await getBangumiCacheSettings();
    expect(settings.expireHours).toBe(168);
  });
});

describe("updateBangumiCacheSettings", () => {
  it("应持久化更新后的设置", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockSetSiteSetting.mockResolvedValueOnce(true);
    const result = await updateBangumiCacheSettings({ expireHours: 72 });
    expect(result).toEqual({ autoUpdateEnabled: true, expireHours: 72 });
    expect(mockSetSiteSetting).toHaveBeenCalledWith(BANGUMI_CACHE_SETTINGS_KEY, { autoUpdateEnabled: true, expireHours: 72 });
  });
});

describe("refreshBangumiCache", () => {
  it("无效 bgmID 应抛出错误", async () => {
    await expect(refreshBangumiCache(0)).rejects.toThrow("Invalid Bangumi ID");
    await expect(refreshBangumiCache(-1)).rejects.toThrow("Invalid Bangumi ID");
  });

  it("应获取数据并调用 syncAll", async () => {
    mockDb.select.mockReturnValue(makeMockChain([{ bgmid: "100" }]));
    mockGetSubjects.mockResolvedValueOnce({ id: 1, name: "Test", images: { large: "https://lain.bgm.tv/pic/1.jpg" } });
    mockGetRelations.mockResolvedValueOnce([{ id: 100, relation: "前传" }]);
    mockGetCharacters.mockResolvedValueOnce([{ id: 10 }]);

    const result = await refreshBangumiCache(1);

    expect(result).toBe(true);
    expect(mockGetSubjects).toHaveBeenCalledWith(1);
    expect(mockGetRelations).toHaveBeenCalledWith(1);
    expect(mockGetCharacters).toHaveBeenCalledWith(1);
    expect(mockLogger.info).toHaveBeenCalledWith("Bangumi cache refreshed: bgm%d", 1);
  });
});

describe("refreshExpiredBangumiCaches", () => {
  it("autoUpdate 关闭时应返回 0", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: false, expireHours: 168 });
    const result = await refreshExpiredBangumiCaches();
    expect(result).toBe(0);
  });

  it("autoUpdate 开启时应查询过期 subjects 并排队刷新", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockDb.select.mockReturnValue(makeMockChain([{ bgmid: 1 }, { bgmid: 2 }]));
    const result = await refreshExpiredBangumiCaches();
    expect(result).toBe(2);
  });
});

describe("ensureStructuredData", () => {
  it("无效 bgmID 应直接返回且不查询", async () => {
    await ensureStructuredData(0);
    await ensureStructuredData(-1);
    await ensureStructuredData(NaN);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("subjects 存在且未过期时应跳过刷新", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    const freshDate = new Date();
    mockDb.select.mockReturnValueOnce(makeMockChain([{ bgmid: 1, updatedAt: freshDate }]));

    await ensureStructuredData(1);

    expect(mockGetSubjects).not.toHaveBeenCalled();
  });

  it("subjects 不存在时应触发刷新", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockDb.select.mockReturnValueOnce(makeMockChain([]));

    await ensureStructuredData(1);

    expect(mockGetSubjects).toHaveBeenCalledWith(1);
  });

  it("subjects 已过期时应触发刷新", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 1 });
    const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
    mockDb.select.mockReturnValueOnce(makeMockChain([{ bgmid: 1, updatedAt: expiredDate }]));

    await ensureStructuredData(1);

    expect(mockGetSubjects).toHaveBeenCalledWith(1);
  });
});

describe("listBangumiCaches", () => {
  it("无 anime bgmid 时应返回空列表与默认 settings", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockDb.select.mockReturnValueOnce(makeMockChain([]));

    const result = await listBangumiCaches(0, 50);

    expect(result.total).toBe(0);
    expect(result.list).toEqual([]);
    expect(result.settings).toEqual({ autoUpdateEnabled: true, expireHours: 168 });
  });

  it("bgmid 存在但未同步时应标记为 unsynced", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockDb.select
      .mockReturnValueOnce(makeMockChain([{ bgmid: "123" }, { bgmid: "456" }]))
      .mockReturnValueOnce(makeMockChain([]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await listBangumiCaches(0, 50);

    expect(result.total).toBe(2);
    expect(result.list).toHaveLength(2);
    expect(result.list[0].bgmID).toBe(123);
    expect(result.list[0].syncStatus).toBe("unsynced");
    expect(result.list[0].hasEpisodes).toBe(false);
    expect(result.list[0].hasCharacters).toBe(false);
    expect(result.list[1].syncStatus).toBe("unsynced");
  });

  it("subject 已同步且未过期时应标记为 synced", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    const freshDate = new Date();
    mockDb.select
      .mockReturnValueOnce(makeMockChain([{ bgmid: "123" }]))
      .mockReturnValueOnce(makeMockChain([{ bgmid: 123, updatedAt: freshDate, subjectId: 10 }]))
      .mockReturnValueOnce(makeMockChain([{ subject_id: 10 }]))
      .mockReturnValueOnce(makeMockChain([{ subject_id: 10 }]))
      .mockReturnValueOnce(makeMockChain([{ bgmid: "123", cnt: 2 }]));

    const result = await listBangumiCaches(0, 50);

    expect(result.list[0].syncStatus).toBe("synced");
    expect(result.list[0].bgmID).toBe(123);
    expect(result.list[0].updateTime).toBe(freshDate);
    expect(result.list[0].hasEpisodes).toBe(true);
    expect(result.list[0].hasCharacters).toBe(true);
    expect(result.list[0].animeCount).toBe(2);
  });

  it("subject 已过期时应标记为 expired", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 1 });
    const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
    mockDb.select
      .mockReturnValueOnce(makeMockChain([{ bgmid: "123" }]))
      .mockReturnValueOnce(makeMockChain([{ bgmid: 123, updatedAt: expiredDate, subjectId: 10 }]))
      .mockReturnValueOnce(makeMockChain([]))
      .mockReturnValueOnce(makeMockChain([]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await listBangumiCaches(0, 50);

    expect(result.list[0].syncStatus).toBe("expired");
    expect(result.list[0].hasEpisodes).toBe(false);
    expect(result.list[0].hasCharacters).toBe(false);
  });

  it("分页参数应正确切片", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    const bgmRows = Array.from({ length: 5 }, (_, i) => ({ bgmid: String(100 + i) }));
    mockDb.select
      .mockReturnValueOnce(makeMockChain(bgmRows))
      .mockReturnValueOnce(makeMockChain([]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await listBangumiCaches(2, 2);

    expect(result.total).toBe(5);
    expect(result.list).toHaveLength(2);
    expect(result.list[0].bgmID).toBe(102);
    expect(result.list[1].bgmID).toBe(103);
  });
});
