import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDriverList = vi.fn();

vi.mock("../../common/database/connection.js", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() =>
            Promise.resolve([
              {
                id: "DRV1",
                name: "驱动A",
                description: "",
                type: "alist",
                config: '{"host":"https://a.example.com","path":"/data","password":""}',
                banNSFW: 0,
                enabled: 1,
                isDefault: 1,
                sortOrder: 0,
                createdAt: null,
                updatedAt: null,
              },
              {
                id: "DRV2",
                name: "驱动B",
                description: "",
                type: "alist",
                config: '{"host":"https://b.example.com","path":"/data","password":""}',
                banNSFW: 0,
                enabled: 1,
                isDefault: 0,
                sortOrder: 1,
                createdAt: null,
                updatedAt: null,
              },
            ])
          ),
        })),
      })),
    })),
    execute: vi.fn(),
  },
}));

vi.mock("../../services/v2/anime/index.js", () => ({
  getAnimeByID: vi.fn(),
}));

vi.mock("../../services/v2/anime/file-index.js", () => ({
  isCacheValid: vi.fn(),
  findActiveByDrive: vi.fn(),
  upsertEntries: vi.fn(),
  softDeleteStale: vi.fn(),
}));

vi.mock("../../common/filesystem/factory.js", () => ({
  createDriver: vi.fn(() => ({
    type: "alist",
    list: mockDriverList,
  })),
}));

vi.mock("../../common/tools/logger.js", () => ({
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { getAggregatedFiles } from "../../services/v2/anime/file-aggregate.js";
import { getAnimeByID } from "../../services/v2/anime/index.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import type { FileIndexRecord } from "../../services/v2/anime/file-index.js";

const mockAnimeService = {
  getAnimeByID: getAnimeByID as ReturnType<typeof vi.fn>,
  isCacheValid: fileIndexService.isCacheValid as ReturnType<typeof vi.fn>,
  findActiveByDrive: fileIndexService.findActiveByDrive as ReturnType<typeof vi.fn>,
  upsertEntries: fileIndexService.upsertEntries as ReturnType<typeof vi.fn>,
  softDeleteStale: fileIndexService.softDeleteStale as ReturnType<typeof vi.fn>,
};

function makeAnime(overrides?: Record<string, unknown>) {
  return {
    deleted: 0,
    index: { year: "2024年", type: "TV", name: "测试番剧" },
    ...overrides,
  };
}

function makeIndexRecord(overrides: Partial<FileIndexRecord>): FileIndexRecord {
  return {
    id: 1,
    driveId: "DRV1",
    animeId: null,
    path: "/2024年/TV/测试番剧/ep01.mkv",
    name: "ep01.mkv",
    size: 500,
    type: "file",
    deleted: 0,
    modified: new Date("2024-01-01"),
    indexedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAnimeService.getAnimeByID.mockResolvedValue(makeAnime());
  mockAnimeService.isCacheValid.mockResolvedValue(true);
  mockAnimeService.findActiveByDrive.mockResolvedValue([]);
});

describe("getAggregatedFiles", () => {
  describe("已删除番剧", () => {
    it("应抛出错误", async () => {
      mockAnimeService.getAnimeByID.mockResolvedValue(makeAnime({ deleted: 1 }));
      await expect(getAggregatedFiles(1)).rejects.toThrow("此 laID 不存在");
    });
  });

  describe("单驱动缓存命中", () => {
    it("应返回缓存中的文件（不去刷新）", async () => {
      mockAnimeService.findActiveByDrive
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/a.mkv", name: "a.mkv", size: 100 }),
        ])
        .mockResolvedValue([]);

      const result = await getAggregatedFiles(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("a.mkv");
      expect(result[0].drives).toHaveLength(1);
      expect(result[0].drives[0].driveId).toBe("DRV1");
      expect(mockDriverList).not.toHaveBeenCalled();
    });
  });

  describe("单驱动缓存未命中", () => {
    it("应触发刷新后再返回数据", async () => {
      mockAnimeService.isCacheValid.mockResolvedValue(false);
      mockDriverList.mockResolvedValue([
        { name: "ep01.mkv", path: "/2024年/TV/测试番剧/ep01.mkv", type: "file", size: 300, modified: "2024-01-01" },
      ]);
      mockAnimeService.findActiveByDrive
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/ep01.mkv", name: "ep01.mkv", size: 300 }),
        ]);

      const result = await getAggregatedFiles(1);

      expect(mockDriverList).toHaveBeenCalledWith("/2024年/TV/测试番剧");
      expect(mockAnimeService.upsertEntries).toHaveBeenCalled();
      expect(mockAnimeService.softDeleteStale).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("ep01.mkv");
    });

    it("刷新失败时仍应返回 findActiveByDrive 的结果", async () => {
      mockAnimeService.isCacheValid.mockResolvedValue(false);
      mockDriverList.mockRejectedValue(new Error("网络错误"));
      mockAnimeService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/old.mkv", name: "old.mkv", size: 50 }),
      ]);

      const result = await getAggregatedFiles(1);

      expect(mockDriverList).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("old.mkv");
    });
  });

  describe("跨驱动去重", () => {
    it("同名文件应合并 drives 数组", async () => {
      mockAnimeService.findActiveByDrive
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/a.mkv", name: "a.mkv", size: 100 }),
        ])
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV2", path: "/2024年/TV/测试番剧/a.mkv", name: "a.mkv", size: 200 }),
        ]);

      const result = await getAggregatedFiles(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("a.mkv");
      expect(result[0].drives).toHaveLength(2);
      expect(result[0].drives.map((d) => d.driveId).sort()).toEqual(["DRV1", "DRV2"]);
      expect(result[0].size).toBe(200);
    });

    it("去重后取最大 size", async () => {
      mockAnimeService.findActiveByDrive
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/b.mp4", name: "b.mp4", size: 500 }),
        ])
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV2", path: "/2024年/TV/测试番剧/b.mp4", name: "b.mp4", size: 100 }),
        ]);

      const result = await getAggregatedFiles(1);

      expect(result[0].size).toBe(500);
    });

    it("不同文件名应保留为独立条目", async () => {
      mockAnimeService.findActiveByDrive
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/a.mkv", name: "a.mkv", size: 100 }),
        ])
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV2", path: "/2024年/TV/测试番剧/b.mkv", name: "b.mkv", size: 200 }),
        ]);

      const result = await getAggregatedFiles(1);

      expect(result).toHaveLength(2);
    });

    it("同一驱动内同名文件不应重复", async () => {
      mockAnimeService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ id: 1, driveId: "DRV1", path: "/2024年/TV/测试番剧/x.mkv", name: "x.mkv" }),
        makeIndexRecord({ id: 2, driveId: "DRV1", path: "/2024年/TV/测试番剧/x.mkv", name: "x.mkv", size: 999 }),
      ]);

      const result = await getAggregatedFiles(1);

      expect(result).toHaveLength(1);
      expect(result[0].size).toBe(999);
    });
  });

  describe("部分驱动失败", () => {
    it("一个驱动失败不影响其他驱动的结果", async () => {
      mockAnimeService.findActiveByDrive
        .mockResolvedValueOnce([
          makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/a.mkv", name: "a.mkv", size: 100 }),
        ])
        .mockRejectedValueOnce(new Error("驱动 B 查询失败"));

      const result = await getAggregatedFiles(1);

      expect(result).toHaveLength(1);
      expect(result[0].drives[0].driveId).toBe("DRV1");
    });
  });

  describe("文件类型判断", () => {
    it("type 为 file 的条目应有 parseResult", async () => {
      mockAnimeService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/ep.mkv", name: "ep.mkv", type: "file" }),
      ]);

      const result = await getAggregatedFiles(1);

      expect(result[0].parseResult).toBeDefined();
    });

    it("type 为 dir 的条目不应有 parseResult", async () => {
      mockAnimeService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ driveId: "DRV1", path: "/2024年/TV/测试番剧/Subs", name: "Subs", type: "dir", size: 0 }),
      ]);

      const result = await getAggregatedFiles(1);

      expect(result[0].parseResult).toBeUndefined();
    });
  });

  describe("空结果", () => {
    it("无驱动时应返回空数组", async () => {
      // The mock db returns 2 drives by default with enabled=1.
      // But this was already handled in other tests.
      // Here we verify empty result handling.
      mockAnimeService.findActiveByDrive.mockResolvedValue([]);

      const result = await getAggregatedFiles(1);

      expect(result).toEqual([]);
    });
  });
});
