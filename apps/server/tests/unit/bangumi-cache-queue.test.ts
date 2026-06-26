import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, makeMockChain, mockLogger, mockGetSiteSetting, mockSetSiteSetting, mockGetSubjects, mockGetRelations, mockGetCharacters, mockSyncAll } = vi.hoisted(() => {
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
    mockSyncAll: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../../common/database/connection.js", () => ({ db: mockDb }));
vi.mock("../../common/tools/logger.js", () => ({ log: mockLogger }));
vi.mock("../../services/v2/site/setting.js", () => ({ getSiteSetting: mockGetSiteSetting, setSiteSetting: mockSetSiteSetting }));
vi.mock("../../services/v2/bangumi/api.js", () => ({ getBangumiSubjects: mockGetSubjects, getBangumiRelations: mockGetRelations, getBangumiCharacters: mockGetCharacters }));
vi.mock("../../services/v2/bangumi/sync.js", () => ({ syncAll: mockSyncAll }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(makeMockChain([]));
  mockDb.insert.mockReturnValue(makeMockChain());
  mockDb.update.mockReturnValue(makeMockChain());
  mockGetSiteSetting.mockReset();
  mockGetSiteSetting.mockResolvedValue({ autoUpdateEnabled: true, expireHours: 168 });
  mockSetSiteSetting.mockReset();
  mockGetSubjects.mockReset();
  mockGetSubjects.mockResolvedValue({ id: 1, images: {} });
  mockGetRelations.mockReset();
  mockGetRelations.mockResolvedValue([]);
  mockGetCharacters.mockReset();
  mockGetCharacters.mockResolvedValue([]);
  mockSyncAll.mockReset();
  mockSyncAll.mockResolvedValue(undefined);
});

async function importCache() {
  return await import("../../services/v2/bangumi/cache.js");
}

describe("getBangumiCacheStatus", () => {
  it("初始状态应全部为空", async () => {
    const { getBangumiCacheStatus } = await importCache();
    const status = getBangumiCacheStatus();
    expect(status.active).toBe(0);
    expect(status.pending).toBe(0);
    expect(status.concurrency).toBe(5);
    expect(status.refreshing).toEqual([]);
    expect(status.schedulerRunning).toBe(false);
    expect(status.totalCompleted).toBe(0);
    expect(status.totalFailed).toBe(0);
    expect(status.lastEventAt).toBeNull();
    expect(status.currentBatch).toBeNull();
    expect(status.lastBatch).toBeNull();
    expect(status.log).toEqual([]);
  });

  it("成功刷新一次后应累计 totalCompleted 与 log", async () => {
    const { queueBangumiCacheRefresh, getBangumiCacheStatus } = await importCache();
    queueBangumiCacheRefresh(1);
    await vi.waitFor(() => {
      expect(getBangumiCacheStatus().totalCompleted).toBe(1);
    });
    const status = getBangumiCacheStatus();
    expect(status.totalFailed).toBe(0);
    expect(status.log).toHaveLength(1);
    expect(status.log[0].bgmID).toBe(1);
    expect(status.log[0].status).toBe("success");
    expect(status.lastEventAt).not.toBeNull();
  });

  it("刷新失败应累计 totalFailed 与 log", async () => {
    mockGetSubjects.mockRejectedValueOnce(new Error("network error"));
    const { queueBangumiCacheRefresh, getBangumiCacheStatus } = await importCache();
    queueBangumiCacheRefresh(1);
    await vi.waitFor(() => {
      expect(getBangumiCacheStatus().totalFailed).toBe(1);
    });
    const status = getBangumiCacheStatus();
    expect(status.totalCompleted).toBe(0);
    expect(status.log).toHaveLength(1);
    expect(status.log[0].status).toBe("failed");
    expect(status.log[0].error).toBe("network error");
  });

  it("log 最大保留 30 条（先进先出）", async () => {
    const { queueBangumiCacheRefresh, getBangumiCacheStatus } = await importCache();
    for (let i = 1; i <= 35; i++) {
      queueBangumiCacheRefresh(i);
    }
    await vi.waitFor(() => {
      expect(getBangumiCacheStatus().totalCompleted).toBe(35);
    });
    const status = getBangumiCacheStatus();
    expect(status.log).toHaveLength(30);
    expect(status.log[0].bgmID).toBe(35);
    expect(status.log[29].bgmID).toBe(6);
  });
});

describe("queueBangumiCacheRefresh", () => {
  it("无效 bgmID 应返回 false", async () => {
    const { queueBangumiCacheRefresh } = await importCache();
    expect(queueBangumiCacheRefresh(0)).toBe(false);
    expect(queueBangumiCacheRefresh(-1)).toBe(false);
    expect(queueBangumiCacheRefresh(NaN)).toBe(false);
  });

  it("有效 bgmID 应返回 true 并立即开始刷新", async () => {
    const { queueBangumiCacheRefresh, getBangumiCacheStatus } = await importCache();
    expect(queueBangumiCacheRefresh(1)).toBe(true);
    expect(getBangumiCacheStatus().refreshing).toContain(1);
  });

  it("重复排队同一 bgmID 应返回 false", async () => {
    const { queueBangumiCacheRefresh } = await importCache();
    expect(queueBangumiCacheRefresh(1)).toBe(true);
    expect(queueBangumiCacheRefresh(1)).toBe(false);
  });

  it("不同 bgmID 应分别入队", async () => {
    const { queueBangumiCacheRefresh, getBangumiCacheStatus } = await importCache();
    expect(queueBangumiCacheRefresh(1)).toBe(true);
    expect(queueBangumiCacheRefresh(2)).toBe(true);
    const status = getBangumiCacheStatus();
    expect(status.refreshing).toContain(1);
    expect(status.refreshing).toContain(2);
  });
});

describe("refreshExpiredBangumiCaches batch", () => {
  it("应开启新批次并填充 total", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockDb.select
      .mockReturnValueOnce(makeMockChain([{ bgmid: 1 }, { bgmid: 2 }]))
      .mockReturnValueOnce(makeMockChain([]));

    const { refreshExpiredBangumiCaches, getBangumiCacheStatus } = await importCache();
    const queued = await refreshExpiredBangumiCaches(10);

    expect(queued).toBe(2);
    const status = getBangumiCacheStatus();
    expect(status.currentBatch).not.toBeNull();
    expect(status.currentBatch?.total).toBe(2);
  });

  it("批次全部完成后应移至 lastBatch", async () => {
    mockGetSiteSetting.mockResolvedValueOnce({ autoUpdateEnabled: true, expireHours: 168 });
    mockDb.select
      .mockReturnValueOnce(makeMockChain([{ bgmid: 1 }, { bgmid: 2 }]))
      .mockReturnValueOnce(makeMockChain([]));

    const { refreshExpiredBangumiCaches, getBangumiCacheStatus } = await importCache();
    await refreshExpiredBangumiCaches(10);

    await vi.waitFor(() => {
      const status = getBangumiCacheStatus();
      expect(status.currentBatch).toBeNull();
      expect(status.lastBatch).not.toBeNull();
    });

    const status = getBangumiCacheStatus();
    expect(status.lastBatch?.completed).toBe(2);
    expect(status.lastBatch?.failed).toBe(0);
    expect(status.lastBatch?.finishedAt).not.toBeNull();
  });
});
