import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../../common/database/connection.js";
import { drives } from "../../common/database/schema/drive.js";
import { fileIndex } from "../../common/database/schema/file-index.js";
import type { FileSystemEntry } from "../../common/filesystem/types.js";

const mockList = vi.fn();

vi.mock("../../common/filesystem/factory.js", () => ({
  createDriver: vi.fn((config: { type: string }) => {
    if (config.type !== "alist") {
      throw new Error(`不支持的文件系统类型: ${config.type}`);
    }
    return {
      type: "alist",
      list: mockList,
    };
  }),
}));

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import scanAllDrives from "../../tasks/v2/scan.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import { log } from "../../common/tools/logger.js";

function mockListing(listings: Record<string, FileSystemEntry[] | Error>) {
  mockList.mockImplementation(async (path: string) => {
    const listing = listings[path];
    if (listing instanceof Error) throw listing;
    if (!listing) throw new Error(`unexpected list path: ${path}`);
    return listing;
  });
}

function file(path: string, name: string, size = 1): FileSystemEntry {
  return { name, path, type: "file", size, modified: "" };
}

function dir(path: string, name: string): FileSystemEntry {
  return { name, path, type: "dir", size: 0, modified: "" };
}

async function readHealth(driveId = "1A") {
  const [row] = await db
    .select({
      at: drives.lastScanAt,
      ok: drives.lastScanOk,
      rows: drives.lastScanRows,
      error: drives.lastScanError,
    })
    .from(drives)
    .where(eq(drives.id, driveId));
  return row;
}

beforeEach(async () => {
  vi.clearAllMocks();
  await db.execute(sql.raw("DELETE FROM file_index"));
  await db.execute(sql.raw("DELETE FROM drives WHERE id LIKE 'scan-%'"));
  await db.execute(sql.raw("UPDATE drives SET enabled = IF(id = '1A', 1, 0)"));
  await db.execute(
    sql.raw(
      "UPDATE drives SET last_scan_at = NULL, last_scan_ok = NULL, last_scan_rows = NULL, last_scan_error = NULL",
    ),
  );
});

afterEach(async () => {
  await db.execute(sql.raw("DELETE FROM file_index"));
  await db.execute(sql.raw("DELETE FROM drives WHERE id LIKE 'scan-%'"));
  await db.execute(sql.raw("UPDATE drives SET enabled = IF(id = '1A', 1, 0)"));
});

describe("scanAllDrives", () => {
  it("应递归扫描所有条目（归一化路径）并写入健康状态", async () => {
    mockListing({
      "/": [file("/file1.mkv", "file1.mkv", 100), dir("/subdir", "subdir")],
      "/subdir": [file("/subdir/file2.mkv", "file2.mkv", 200)],
    });

    const report = await scanAllDrives();

    expect(mockList).toHaveBeenCalledTimes(2);
    expect(mockList).toHaveBeenCalledWith("/");
    expect(report.ok).toBe(true);
    expect(report.drives).toHaveLength(1);
    expect(report.drives[0]).toMatchObject({ driveId: "1A", ok: true, rows: 3 });
    expect(report.drives[0].finishedAt).toBeInstanceOf(Date);

    const files = await fileIndexService.findActiveByDrive("1A", "/");
    expect(files).toHaveLength(3);
    expect(files.some((entry) => entry.name === "file1.mkv")).toBe(true);
    expect(files.some((entry) => entry.name === "subdir")).toBe(true);
    expect(files.some((entry) => entry.name === "file2.mkv")).toBe(true);

    const health = await readHealth();
    expect(health.ok).toBe(1);
    expect(health.rows).toBe(3);
    expect(health.error).toBeNull();
    expect(health.at).toBeInstanceOf(Date);
  });

  it("deleted 标记的文件重新出现时应恢复", async () => {
    mockListing({
      "/": [file("/ghost.mkv", "ghost.mkv"), file("/alive.mkv", "alive.mkv")],
    });

    await scanAllDrives();

    await db.execute(
      sql.raw("UPDATE file_index SET deleted = 1 WHERE path = '/ghost.mkv' AND drive_id = '1A'"),
    );

    vi.clearAllMocks();
    mockListing({
      "/": [file("/ghost.mkv", "ghost.mkv", 999), file("/alive.mkv", "alive.mkv")],
    });

    const report = await scanAllDrives();
    expect(report.ok).toBe(true);

    const files = await fileIndexService.findActiveByDrive("1A", "/");
    expect(files).toHaveLength(2);
    const ghost = files.find((entry) => entry.name === "ghost.mkv")!;
    expect(ghost.size).toBe(999);
    expect(ghost.deleted).toBe(0);
  });

  it("子目录 list 失败时报告 ok=false，且该子目录及其后代保持 active", async () => {
    await fileIndexService.upsertEntries([
      { driveId: "1A", path: "/bad", name: "bad", type: "dir" },
      { driveId: "1A", path: "/bad/deep.mkv", name: "deep.mkv", type: "file" },
      { driveId: "1A", path: "/bad/nested", name: "nested", type: "dir" },
      { driveId: "1A", path: "/bad/nested/x.mkv", name: "x.mkv", type: "file" },
    ]);

    mockListing({
      "/": [dir("/bad", "bad"), dir("/good", "good")],
      "/bad": new Error("permission denied"),
      "/good": [file("/good/ok.mkv", "ok.mkv")],
    });

    const report = await scanAllDrives();

    expect(report.ok).toBe(false);
    expect(report.drives[0].ok).toBe(false);
    expect(report.drives[0].rows).toBe(3);
    expect(report.drives[0].error).toContain("/bad");
    expect(report.drives[0].error).toContain("permission denied");
    expect(log.error).toHaveBeenCalled();

    const all = await db.select().from(fileIndex);
    const badRows = all.filter((row) => row.path.startsWith("/bad"));
    expect(badRows).toHaveLength(4);
    expect(badRows.every((row) => row.deleted === 0)).toBe(true);

    const health = await readHealth();
    expect(health.ok).toBe(0);
    expect(health.rows).toBe(3);
    expect(health.error).toContain("permission denied");
  });

  it("根目录 list 失败时报告 ok=false，rows=0", async () => {
    mockListing({ "/": new Error("auth failed") });

    const report = await scanAllDrives();

    expect(report.ok).toBe(false);
    expect(report.drives[0]).toMatchObject({ driveId: "1A", ok: false, rows: 0 });
    expect(report.drives[0].error).toContain("auth failed");

    const health = await readHealth();
    expect(health.ok).toBe(0);
    expect(health.rows).toBe(0);
    expect(health.error).toContain("auth failed");
  });

  it("缺失的直接子目录及其后代应被软删除", async () => {
    await fileIndexService.upsertEntries([
      { driveId: "1A", path: "/old", name: "old", type: "dir" },
      { driveId: "1A", path: "/old/file.mkv", name: "file.mkv", type: "file" },
      { driveId: "1A", path: "/old/sub/deep.mkv", name: "deep.mkv", type: "file" },
      { driveId: "1A", path: "/keep.mkv", name: "keep.mkv", type: "file" },
    ]);

    mockListing({ "/": [file("/keep.mkv", "keep.mkv")] });

    const report = await scanAllDrives();

    expect(report.ok).toBe(true);

    const all = await db.select().from(fileIndex);
    const oldRows = all.filter((row) => row.path.startsWith("/old"));
    expect(oldRows).toHaveLength(3);
    expect(oldRows.every((row) => row.deleted === 1)).toBe(true);

    const keep = all.find((row) => row.path === "/keep.mkv");
    expect(keep?.deleted).toBe(0);
  });

  it("无启用 drive 时报告 ok=false", async () => {
    await db.execute(sql.raw("UPDATE drives SET enabled = 0"));

    const report = await scanAllDrives();

    expect(report.ok).toBe(false);
    expect(report.drives).toEqual([]);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("type 无效的 drive 也应出现在报告中并落库失败状态", async () => {
    await db.insert(drives).values({
      id: "scan-bad",
      name: "scan-bad",
      description: "invalid type",
      type: "s3",
      config: {},
      enabled: 1,
    });

    mockListing({ "/": [] });

    const report = await scanAllDrives();

    expect(report.ok).toBe(false);
    expect(report.drives).toHaveLength(2);

    const bad = report.drives.find((drive) => drive.driveId === "scan-bad")!;
    expect(bad.ok).toBe(false);
    expect(bad.rows).toBe(0);
    expect(bad.error).toContain("不支持的文件系统类型");

    const good = report.drives.find((drive) => drive.driveId === "1A")!;
    expect(good.ok).toBe(true);

    const health = await readHealth("scan-bad");
    expect(health.ok).toBe(0);
    expect(health.rows).toBe(0);
    expect(health.error).toContain("不支持的文件系统类型");
  });

  it("config 无效的 drive 应报告 ok=false", async () => {
    await db.insert(drives).values({
      id: "scan-bad-config",
      name: "scan-bad-config",
      description: "invalid config",
      type: "alist",
      config: [],
      enabled: 1,
    });

    mockListing({ "/": [] });

    const report = await scanAllDrives();

    expect(report.ok).toBe(false);
    const bad = report.drives.find((drive) => drive.driveId === "scan-bad-config")!;
    expect(bad.ok).toBe(false);
    expect(bad.error).toContain("config 无效");
  });
});
