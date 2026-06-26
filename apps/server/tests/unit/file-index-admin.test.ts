import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetDrive, mockCreateDriver, mockDriverList, mockFileIndexService, mockLogger } = vi.hoisted(() => ({
  mockGetDrive: vi.fn(),
  mockCreateDriver: vi.fn(),
  mockDriverList: vi.fn(),
  mockFileIndexService: {
    upsertEntries: vi.fn().mockResolvedValue(undefined),
    softDeleteStale: vi.fn().mockResolvedValue(undefined),
    getStats: vi.fn().mockResolvedValue(null),
    listIndex: vi.fn().mockResolvedValue({ list: [], total: 0 }),
  },
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../../services/v2/drive/index.js", () => ({ getDrive: mockGetDrive }));
vi.mock("../../common/filesystem/factory.js", () => ({ createDriver: mockCreateDriver }));
vi.mock("../../services/v2/anime/file-index.js", () => mockFileIndexService);
vi.mock("../../common/tools/logger.js", () => ({ log: mockLogger }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetDrive.mockResolvedValue({
    id: "1A",
    name: "测试存储",
    type: "alist",
    config: { host: "https://alist.example.com", path: "/test", password: "" },
  });
  mockCreateDriver.mockReturnValue({ type: "alist", list: mockDriverList });
  mockDriverList.mockResolvedValue([]);
  mockFileIndexService.upsertEntries.mockResolvedValue(undefined);
  mockFileIndexService.softDeleteStale.mockResolvedValue(undefined);
});

async function importAdmin() {
  return await import("../../services/v2/admin/file-index-admin.js");
}

describe("prepareRefreshJob", () => {
  it("无运行任务时应返回新 job", async () => {
    const { prepareRefreshJob } = await importAdmin();
    const result = prepareRefreshJob("1A", "/path");
    expect("busy" in result).toBe(false);
    if ("job" in result) {
      expect(result.job.driveId).toBe("1A");
      expect(result.job.startPath).toBe("/path");
      expect(result.job.status).toBe("running");
      expect(result.job.dirsScanned).toBe(0);
      expect(result.job.filesFound).toBe(0);
      expect(result.job.errors).toBe(0);
      expect(result.job.log).toEqual([]);
    }
  });

  it("空 dirPath 应默认为 /", async () => {
    const { prepareRefreshJob } = await importAdmin();
    const result = prepareRefreshJob("1A", "");
    if ("job" in result) {
      expect(result.job.startPath).toBe("/");
      expect(result.job.currentPath).toBe("/");
    }
  });

  it("已有 running 且最近活跃的 job 时应返回 busy", async () => {
    const { prepareRefreshJob } = await importAdmin();
    prepareRefreshJob("1A", "/first");
    const result = prepareRefreshJob("1A", "/second");
    expect("busy" in result).toBe(true);
    if ("busy" in result) {
      expect(result.busy).toBe(true);
    }
  });

  it("已完成 job 应允许覆写", async () => {
    const { prepareRefreshJob, executeRefresh } = await importAdmin();
    const first = prepareRefreshJob("1A", "/first");
    if ("job" in first) {
      await executeRefresh(first.job);
      expect(first.job.status).toBe("completed");
    }
    const result = prepareRefreshJob("1A", "/second");
    expect("busy" in result).toBe(false);
    if ("job" in result) {
      expect(result.job.startPath).toBe("/second");
    }
  });

  it("已失败 job 应允许覆写", async () => {
    const { prepareRefreshJob } = await importAdmin();
    const first = prepareRefreshJob("1A", "/first");
    if ("job" in first) {
      first.job.status = "failed";
      first.job.finishedAt = Date.now();
    }
    const result = prepareRefreshJob("1A", "/second");
    expect("busy" in result).toBe(false);
    if ("job" in result) {
      expect(result.job.startPath).toBe("/second");
    }
  });

  it("running 但超过 10min 无活动（卡死）的 job 应被覆写", async () => {
    const { prepareRefreshJob } = await importAdmin();
    const first = prepareRefreshJob("1A", "/first");
    if ("job" in first) {
      first.job.lastActivityAt = Date.now() - 11 * 60 * 1000;
    }
    const result = prepareRefreshJob("1A", "/second");
    expect("busy" in result).toBe(false);
    if ("job" in result) {
      expect(result.job.startPath).toBe("/second");
    }
  });

  it("不同 driveId 不应互相影响", async () => {
    const { prepareRefreshJob } = await importAdmin();
    prepareRefreshJob("1A", "/first");
    const result = prepareRefreshJob("2B", "/second");
    expect("busy" in result).toBe(false);
    if ("job" in result) {
      expect(result.job.driveId).toBe("2B");
    }
  });
});

describe("getRefreshStatus", () => {
  it("无 job 时应返回 null", async () => {
    const { getRefreshStatus } = await importAdmin();
    expect(getRefreshStatus("1A")).toBeNull();
  });

  it("应返回 job 的快照副本（修改返回值不影响内部状态）", async () => {
    const { prepareRefreshJob, getRefreshStatus } = await importAdmin();
    prepareRefreshJob("1A", "/path");
    const status = getRefreshStatus("1A");
    expect(status).not.toBeNull();
    expect(status?.driveId).toBe("1A");
    expect(status?.startPath).toBe("/path");
    expect(status?.status).toBe("running");

    status?.log.push({ time: 0, path: "/hacked", files: 0, dirs: 0 });
    const status2 = getRefreshStatus("1A");
    expect(status2?.log).toEqual([]);
  });

  it("不存在的 driveId 应返回 null", async () => {
    const { prepareRefreshJob, getRefreshStatus } = await importAdmin();
    prepareRefreshJob("1A", "/path");
    expect(getRefreshStatus("nonexistent")).toBeNull();
  });
});

describe("executeRefresh", () => {
  it("应递归列出目录并更新索引", async () => {
    const { prepareRefreshJob, executeRefresh } = await importAdmin();
    const prepared = prepareRefreshJob("1A", "/root");
    if ("job" in prepared) {
      mockDriverList
        .mockResolvedValueOnce([
          { name: "ep01.mkv", path: "/root/ep01.mkv", type: "file", size: 100, modified: "2026-01-01" },
          { name: "sub", path: "/root/sub", type: "dir", size: 0, modified: "" },
        ])
        .mockResolvedValueOnce([
          { name: "ep02.mkv", path: "/root/sub/ep02.mkv", type: "file", size: 200, modified: "2026-01-02" },
        ]);

      await executeRefresh(prepared.job);

      expect(prepared.job.status).toBe("completed");
      expect(prepared.job.finishedAt).not.toBeNull();
      expect(prepared.job.dirsScanned).toBe(2);
      expect(prepared.job.filesFound).toBe(2);
      expect(prepared.job.dirsFound).toBe(1);
      expect(mockFileIndexService.upsertEntries).toHaveBeenCalledTimes(2);
      expect(mockFileIndexService.softDeleteStale).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalled();
    }
  });

  it("空目录应正常完成", async () => {
    const { prepareRefreshJob, executeRefresh } = await importAdmin();
    const prepared = prepareRefreshJob("1A", "/empty");
    if ("job" in prepared) {
      mockDriverList.mockResolvedValueOnce([]);
      await executeRefresh(prepared.job);
      expect(prepared.job.status).toBe("completed");
      expect(prepared.job.dirsScanned).toBe(1);
      expect(prepared.job.filesFound).toBe(0);
    }
  });

  it("存储节点不存在时应抛出错误并标记 job 为 failed", async () => {
    mockGetDrive.mockResolvedValueOnce(undefined);
    const { prepareRefreshJob, executeRefresh } = await importAdmin();
    const prepared = prepareRefreshJob("nonexistent", "/");
    if ("job" in prepared) {
      await expect(executeRefresh(prepared.job)).rejects.toThrow("存储节点不存在");
      expect(prepared.job.status).toBe("failed");
      expect(prepared.job.finishedAt).not.toBeNull();
      expect(prepared.job.lastError).toBe("存储节点不存在");
    }
  });

  it("子目录列出失败应记录错误但继续扫描其他子目录", async () => {
    const { prepareRefreshJob, executeRefresh } = await importAdmin();
    const prepared = prepareRefreshJob("1A", "/root");
    if ("job" in prepared) {
      mockDriverList
        .mockResolvedValueOnce([
          { name: "ok", path: "/root/ok", type: "dir", size: 0, modified: "" },
          { name: "bad", path: "/root/bad", type: "dir", size: 0, modified: "" },
        ])
        .mockResolvedValueOnce([{ name: "ep01.mkv", path: "/root/ok/ep01.mkv", type: "file", size: 100, modified: "" }])
        .mockRejectedValueOnce(new Error("AList API 错误: internal error"));

      await executeRefresh(prepared.job);

      expect(prepared.job.status).toBe("completed");
      expect(prepared.job.errors).toBe(1);
      expect(prepared.job.lastError).toBe("AList API 错误: internal error");
      expect(prepared.job.filesFound).toBe(1);
      expect(mockLogger.error).toHaveBeenCalled();
    }
  });

  it("被新 job 覆写时应自我中止且不覆写新 job 状态", async () => {
    const { prepareRefreshJob, executeRefresh, getRefreshStatus } = await importAdmin();
    const first = prepareRefreshJob("1A", "/first");
    if ("job" in first) {
      mockDriverList.mockReset();
      let overwriteCalled = false;
      mockDriverList.mockImplementation(async () => {
        if (!overwriteCalled) {
          overwriteCalled = true;
          first.job.lastActivityAt = Date.now() - 11 * 60 * 1000;
          prepareRefreshJob("1A", "/second");
        }
        return [];
      });

      await executeRefresh(first.job);

      expect(first.job.status).toBe("running");
      expect(first.job.finishedAt).toBeNull();
      const status = getRefreshStatus("1A");
      expect(status?.startPath).toBe("/second");
    }
  });
});
