import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../../common/database/connection.js";

const mockList = vi.fn();

vi.mock("../../common/filesystem/factory.js", () => ({
  createDriver: vi.fn(() => ({
    type: "alist",
    list: mockList,
  })),
}));

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import scanAllDrives from "../../tasks/v2/scan.js";
import { log } from "../../common/tools/logger.js";

beforeEach(async () => {
  vi.clearAllMocks();
  await db.execute(sql.raw("DELETE FROM file_index"));
});

afterEach(async () => {
  await db.execute(sql.raw("DELETE FROM file_index"));
});

describe("scanAllDrives", () => {
  it("应递归扫描所有条目（归一化路径）", async () => {
    mockList
      .mockResolvedValueOnce([
        { name: "file1.mkv", path: "/file1.mkv", type: "file", size: 100, modified: "" },
        { name: "subdir", path: "/subdir", type: "dir", size: 0, modified: "" },
      ])
      .mockResolvedValueOnce([
        { name: "file2.mkv", path: "/subdir/file2.mkv", type: "file", size: 200, modified: "" },
      ]);

    await scanAllDrives();

    expect(mockList).toHaveBeenCalledTimes(2);
    expect(mockList).toHaveBeenCalledWith("/");

    const { findActiveByDrive } = await import("../../services/v2/anime/file-index.js");
    const files = await findActiveByDrive("1A", "/");
    expect(files).toHaveLength(3);
    expect(files.some((f) => f.name === "file1.mkv")).toBe(true);
    expect(files.some((f) => f.name === "subdir")).toBe(true);
    expect(files.some((f) => f.name === "file2.mkv")).toBe(true);
  });

  it("deleted 标记的文件重新出现时应恢复", async () => {
    const { upsertEntries, softDeleteStale } = await import("../../services/v2/anime/file-index.js");

    // 第一次扫描：有 ghost.mkv
    mockList.mockResolvedValueOnce([
      { name: "ghost.mkv", path: "/ghost.mkv", type: "file", size: 1, modified: "" },
      { name: "alive.mkv", path: "/alive.mkv", type: "file", size: 1, modified: "" },
    ]);

    await scanAllDrives();

    // 手动标记 ghost.mkv 为已删除（模拟文件被删除）
    await db.execute(sql.raw("UPDATE file_index SET deleted = 1 WHERE path = '/ghost.mkv' AND drive_id = '1A'"));

    // 第二次扫描：ghost.mkv 重新出现
    vi.clearAllMocks();
    mockList.mockResolvedValueOnce([
      { name: "ghost.mkv", path: "/ghost.mkv", type: "file", size: 999, modified: "" },
      { name: "alive.mkv", path: "/alive.mkv", type: "file", size: 1, modified: "" },
    ]);

    await scanAllDrives();

    const { findActiveByDrive: find } = await import("../../services/v2/anime/file-index.js");
    const files = await find("1A", "/");
    expect(files).toHaveLength(2);
    const ghost = files.find((f) => f.name === "ghost.mkv")!;
    expect(ghost.size).toBe(999);
    expect(ghost.deleted).toBe(0);
  });

  it("某个目录 list 失败时应记录错误但继续", async () => {
    mockList
      .mockResolvedValueOnce([
        { name: "good", path: "/good", type: "dir", size: 0, modified: "" },
        { name: "bad", path: "/bad", type: "dir", size: 0, modified: "" },
      ])
      .mockRejectedValueOnce(new Error("permission denied"))  // bad 目录失败
      .mockResolvedValueOnce([  // good 目录成功
        { name: "ok.mkv", path: "/good/ok.mkv", type: "file", size: 1, modified: "" },
      ]);

    await scanAllDrives();

    expect(log.error).toHaveBeenCalled();
  });
});
