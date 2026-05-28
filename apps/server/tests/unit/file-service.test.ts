import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDriverList = vi.fn();
const mockDriverGetDownloadUrl = vi.fn();

vi.mock("../../services/v2/anime/index.js", () => ({
  getAnimeByID: vi.fn(),
}));

vi.mock("../../services/v2/drive/index.js", () => ({
  getDrive: vi.fn(),
  getDefaultDrive: vi.fn(),
}));

vi.mock("../../services/v2/anime/file-index.js", () => ({
  isCacheValid: vi.fn(),
  findActiveByDrive: vi.fn(),
  upsertEntries: vi.fn(),
  softDeleteStale: vi.fn(),
  touchIndexedAt: vi.fn(),
}));

vi.mock("../../common/filesystem/factory.js", () => ({
  createDriver: vi.fn(() => ({
    type: "alist",
    list: mockDriverList,
    getDownloadUrl: mockDriverGetDownloadUrl,
  })),
}));

import { getFilesByID, refreshAnimeFileIndex } from "../../services/v2/anime/file.js";
import { getAnimeByID } from "../../services/v2/anime/index.js";
import { getDrive, getDefaultDrive } from "../../services/v2/drive/index.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import type { FileIndexRecord } from "../../services/v2/anime/file-index.js";

function mockAnime(overrides?: Record<string, unknown>) {
  return {
    deleted: 0,
    type: { nsfw: false },
    index: { year: "2024年", type: "TV", name: "测试番剧 123456" },
    ...overrides,
  };
}

function mockDrive(overrides?: Record<string, unknown>) {
  return {
    id: "1A",
    name: "测试存储",
    description: "",
    banNSFW: false,
    disableDownload: false,
    connectionConfigId: 1,
    enabled: true,
    isDefault: true,
    sortOrder: 0,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makeIndexRecord(overrides: Partial<FileIndexRecord>): FileIndexRecord {
  return {
    id: 1,
    driveId: "1A",
    animeId: null,
    path: "/2024年/TV/测试番剧/a.mkv",
    name: "a.mkv",
    size: 0,
    type: "file",
    deleted: 0,
    modified: null,
    sign: null,
    indexedAt: new Date(),
    ...overrides,
  };
}

const mockAnimeIndexService = {
  getAnimeByID: getAnimeByID as ReturnType<typeof vi.fn>,
  getDrive: getDrive as ReturnType<typeof vi.fn>,
  getDefaultDrive: getDefaultDrive as ReturnType<typeof vi.fn>,
  isCacheValid: fileIndexService.isCacheValid as ReturnType<typeof vi.fn>,
  findActiveByDrive: fileIndexService.findActiveByDrive as ReturnType<typeof vi.fn>,
  upsertEntries: fileIndexService.upsertEntries as ReturnType<typeof vi.fn>,
  softDeleteStale: fileIndexService.softDeleteStale as ReturnType<typeof vi.fn>,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDriverGetDownloadUrl.mockReturnValue("https://public.example.com/d/file.mkv");
  mockAnimeIndexService.getAnimeByID.mockResolvedValue(mockAnime());
  mockAnimeIndexService.getDrive.mockResolvedValue(mockDrive());
  mockAnimeIndexService.getDefaultDrive.mockResolvedValue("1A");
});

describe("getFilesByID", () => {
  const DIR_PATH = "/2024年/TV/测试番剧 123456";

  describe("缓存命中路径", () => {
    it("应直接返回缓存数据", async () => {
      mockAnimeIndexService.isCacheValid.mockResolvedValue(true);
      mockAnimeIndexService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ path: `${DIR_PATH}/ep01.mkv`, name: "ep01.mkv", size: 500, type: "file", modified: new Date() }),
        makeIndexRecord({ path: `${DIR_PATH}/Subs`, name: "Subs", size: 0, type: "dir", modified: null }),
      ]);

      const result = await getFilesByID(1, "1A");

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(mockDriverList).not.toHaveBeenCalled();
    });

    it("文件条目应有 parseResult 和 url", async () => {
      mockAnimeIndexService.isCacheValid.mockResolvedValue(true);
      mockAnimeIndexService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ path: `${DIR_PATH}/ep.mkv`, name: "ep.mkv", size: 500, type: "file", modified: new Date() }),
      ]);

      const result = await getFilesByID(1, "1A");
      if (typeof result === "string") throw new Error("expected array");

      expect(result[0].type).toBe("file");
      expect(result[0].parseResult).toBeDefined();
      expect(result[0].url).toBeDefined();
    });

    it("directory 条目不应有 parseResult 和 url", async () => {
      mockAnimeIndexService.isCacheValid.mockResolvedValue(true);
      mockAnimeIndexService.findActiveByDrive.mockResolvedValue([
        makeIndexRecord({ path: `${DIR_PATH}/Subs`, name: "Subs", size: 0, type: "dir" }),
      ]);

      const result = await getFilesByID(1, "1A");
      if (typeof result === "string") throw new Error("expected array");

      expect(result[0].type).toBe("dir");
      expect(result[0].parseResult).toBeUndefined();
      expect(result[0].url).toBeUndefined();
    });
  });

  describe("缓存未命中路径", () => {
    it("应触发实时刷新再返回数据", async () => {
      mockAnimeIndexService.isCacheValid.mockResolvedValue(false);
      mockDriverList.mockResolvedValue([
        { name: "ep01.mkv", path: `${DIR_PATH}/ep01.mkv`, type: "file", size: 500, modified: "2026-01-01" },
      ]);
      mockAnimeIndexService.findActiveByDrive
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeIndexRecord({ path: `${DIR_PATH}/ep01.mkv`, name: "ep01.mkv", size: 500, type: "file", modified: new Date() }),
        ]);

      const result = await getFilesByID(1, "1A");

      expect(mockDriverList).toHaveBeenCalledWith(DIR_PATH);
      expect(mockAnimeIndexService.upsertEntries).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it("刷新失败时应返回错误字符串", async () => {
      mockAnimeIndexService.isCacheValid.mockResolvedValue(false);
      mockDriverList.mockRejectedValue(new Error("AList API 错误: internal error"));

      const result = await getFilesByID(1, "1A");

      expect(typeof result).toBe("string");
      expect(result).toContain("意外错误");
    });
  });

  describe("异常路径", () => {
    it("不存在的 laID 应返回错误", async () => {
      mockAnimeIndexService.getAnimeByID.mockResolvedValue({ ...mockAnime(), deleted: 1 });

      const result = await getFilesByID(9999);
      expect(result).toBe("此 laID 不存在");
    });

    it("不存在的 Drive ID 应返回错误", async () => {
      mockAnimeIndexService.getDrive.mockResolvedValue(undefined);

      const result = await getFilesByID(1, "nonexistent");
      expect(result).toBe("存储节点不存在");
    });

    it("未配置连接时返回错误", async () => {
      mockAnimeIndexService.getDrive.mockResolvedValue(mockDrive({ connectionConfigId: null }));

      const result = await getFilesByID(1, "1A");
      expect(result).toBe("存储节点尚未配置连接");
    });
  });
});

describe("refreshAnimeFileIndex", () => {
  const DIR_PATH = "/2024年/TV/测试番剧 123456";

  it("应触发目录刷新（归一化路径）", async () => {
    mockDriverList.mockResolvedValue([
      { name: "ep01.mkv", path: `${DIR_PATH}/ep01.mkv`, type: "file", size: 500, modified: "" },
    ]);

    await refreshAnimeFileIndex(1, "1A");

    expect(mockDriverList).toHaveBeenCalledWith(DIR_PATH);
    expect(mockAnimeIndexService.upsertEntries).toHaveBeenCalled();
    expect(mockAnimeIndexService.softDeleteStale).toHaveBeenCalled();
  });

  it("已删除的番剧应抛错", async () => {
    mockAnimeIndexService.getAnimeByID.mockResolvedValue({ ...mockAnime(), deleted: 1 });

    await expect(refreshAnimeFileIndex(1)).rejects.toThrow("此 laID 不存在");
  });
});
