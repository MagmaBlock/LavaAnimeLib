import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, makeMockChain, mockLogger, mockGetSiteSetting, mockSetSiteSetting, mockGetSubjects, mockGetRelations, mockGetCharacters } = vi.hoisted(() => {
  function makeMockChain(result: unknown = undefined) {
    const chain: Record<string, ReturnType<typeof vi.fn>> & { then: ReturnType<typeof vi.fn> } = {
      then: vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)),
    };
    ["from", "where", "leftJoin", "groupBy", "orderBy", "limit", "offset", "values", "set", "onDuplicateKeyUpdate"].forEach((name) => {
      chain[name] = vi.fn(() => chain);
    });
    return chain;
  }

  return {
    mockDb: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      execute: vi.fn(),
    },
    makeMockChain,
    mockLogger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    mockGetSiteSetting: vi.fn(),
    mockSetSiteSetting: vi.fn(),
    mockGetSubjects: vi.fn(),
    mockGetRelations: vi.fn(),
    mockGetCharacters: vi.fn(),
  };
});

vi.mock("../../common/database/connection.js", () => ({
  db: mockDb,
}));

vi.mock("../../common/tools/logger.js", () => ({
  log: mockLogger,
}));

vi.mock("../../common/config.js", () => ({
  default: {
    bangumiImage: { host: "https://lain.bgm.tv/" },
  },
}));

vi.mock("../../services/v2/site/setting.js", () => ({
  getSiteSetting: mockGetSiteSetting,
  setSiteSetting: mockSetSiteSetting,
}));

vi.mock("../../services/v2/bangumi/api.js", () => ({
  getBangumiSubjects: mockGetSubjects,
  getBangumiRelations: mockGetRelations,
  getBangumiCharacters: mockGetCharacters,
}));

import {
  getBangumiCacheSettings,
  updateBangumiCacheSettings,
  refreshBangumiCache,
  refreshExpiredBangumiCaches,
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
  mockGetSubjects.mockResolvedValue({ images: {} });
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

  it("autoUpdateEnabled 为 false 时应保留", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({
      autoUpdateEnabled: false,
      expireHours: 48,
    });
    const settings = await getBangumiCacheSettings();
    expect(settings).toEqual({ autoUpdateEnabled: false, expireHours: 48 });
  });
});

describe("updateBangumiCacheSettings", () => {
  it("应持久化更新后的设置", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({
      autoUpdateEnabled: true,
      expireHours: 168,
    });
    mockSetSiteSetting.mockResolvedValueOnce(true);

    const result = await updateBangumiCacheSettings({ expireHours: 72 });
    expect(result).toEqual({ autoUpdateEnabled: true, expireHours: 72 });
    expect(mockSetSiteSetting).toHaveBeenCalledWith(BANGUMI_CACHE_SETTINGS_KEY, {
      autoUpdateEnabled: true,
      expireHours: 72,
    });
  });

  it("应允许关闭自动更新", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({
      autoUpdateEnabled: true,
      expireHours: 168,
    });
    mockSetSiteSetting.mockResolvedValueOnce(true);

    const result = await updateBangumiCacheSettings({ autoUpdateEnabled: false });
    expect(result.autoUpdateEnabled).toBe(false);
  });
});

describe("refreshBangumiCache", () => {
  it("无效 bgmID 应抛出错误", async () => {
    await expect(refreshBangumiCache(0)).rejects.toThrow("Invalid Bangumi ID");
    await expect(refreshBangumiCache(-1)).rejects.toThrow("Invalid Bangumi ID");
    await expect(refreshBangumiCache(NaN)).rejects.toThrow("Invalid Bangumi ID");
  });

  it("应获取 subject、relations、characters 并写入数据库", async () => {
    mockDb.select.mockReturnValue(makeMockChain([{ bgmid: "100" }]));

    mockGetSubjects.mockResolvedValueOnce({
      id: 1,
      name: "Test",
      images: { large: "https://lain.bgm.tv/pic/1.jpg" },
    });
    mockGetRelations.mockResolvedValueOnce([{ id: 100 }]);
    mockGetCharacters.mockResolvedValueOnce([{ id: 10 }]);

    const result = await refreshBangumiCache(1);

    expect(result).toBe(true);
    expect(mockGetSubjects).toHaveBeenCalledWith(1);
    expect(mockGetRelations).toHaveBeenCalledWith(1, expect.any(Array));
    expect(mockGetCharacters).toHaveBeenCalledWith(1);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Bangumi cache refreshed: bgm%d",
      1,
    );
  });
});

describe("refreshExpiredBangumiCaches", () => {
  it("autoUpdate 关闭时应返回 0", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({
      autoUpdateEnabled: false,
      expireHours: 168,
    });
    const result = await refreshExpiredBangumiCaches();
    expect(result).toBe(0);
  });

  it("autoUpdate 开启时应查询并排队刷新过期缓存", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({
      autoUpdateEnabled: true,
      expireHours: 168,
    });

    mockDb.select.mockReturnValue(makeMockChain([{ bgmID: 1 }, { bgmID: 2 }]));

    const result = await refreshExpiredBangumiCaches();
    expect(result).toBe(2);
  });
});
