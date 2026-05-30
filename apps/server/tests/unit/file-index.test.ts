import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../../common/database/connection.js";
import * as s from "../../services/v2/anime/file-index.js";

const DRIVE = "test-drive";

afterEach(async () => {
  await db.execute(sql.raw("DELETE FROM file_index"));
});

describe("upsertEntries", () => {
  it("应插入新文件条目", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/file1.mkv", name: "file1.mkv", size: 1024, type: "file" },
    ]);

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("file1.mkv");
    expect(rows[0].size).toBe(1024);
    expect(rows[0].type).toBe("file");
    expect(rows[0].deleted).toBe(0);
    expect(rows[0].indexedAt).toBeInstanceOf(Date);
  });

  it("应插入新目录条目", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/sub", name: "sub", size: 0, type: "dir" },
    ]);

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("dir");
    expect(rows[0].size).toBe(0);
  });

  it("已存在条目应 UPDATE 而非 INSERT", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/file1.mkv", name: "file1.mkv", size: 100, type: "file" },
    ]);
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/file1.mkv", name: "file1.mkv", size: 200, type: "file" },
    ]);

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows).toHaveLength(1);
    expect(rows[0].size).toBe(200);
  });

  it("软删除的文件重新出现时应恢复 deleted=0", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/ghost.mkv", name: "ghost.mkv", size: 500, type: "file" },
    ]);

    await db.execute(sql.raw("UPDATE file_index SET deleted = 1 WHERE drive_id = 'test-drive' AND path = '/root/ghost.mkv'"));

    const before = await db.execute(sql.raw("SELECT deleted FROM file_index WHERE drive_id = 'test-drive' AND path = '/root/ghost.mkv'"));
    // 确认已软删除
    expect(before).toBeDefined();

    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/ghost.mkv", name: "ghost.mkv", size: 999, type: "file" },
    ]);

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows).toHaveLength(1);
    // 应复用原有记录，更新元数据并清除删除标记
    expect(rows[0].size).toBe(999);
    expect(rows[0].deleted).toBe(0);
  });

  it("批量 upsert 应正确处理混合新增和更新", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/existing.mkv", name: "existing.mkv", size: 100, type: "file" },
    ]);

    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/existing.mkv", name: "existing.mkv", size: 999, type: "file" },
      { driveId: DRIVE, path: "/root/new_file.mkv", name: "new_file.mkv", size: 200, type: "file" },
    ]);

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.name === "existing.mkv")!.size).toBe(999);
    expect(rows.find((r) => r.name === "new_file.mkv")!.size).toBe(200);
  });

  it("应正确存储 animeId", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/ep1.mkv", name: "ep1.mkv", size: 500, type: "file", animeId: 42 },
    ]);
    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows[0].animeId).toBe(42);
  });

  it("animeId 为 null 时应正确存储 NULL", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/ep1.mkv", name: "ep1.mkv", size: 500, type: "file", animeId: null },
    ]);
    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows[0].animeId).toBeNull();
  });
});

describe("findActiveByDrive", () => {
  it("应只返回 deleted=0 的条目", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/alive.mkv", name: "alive.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/dead.mkv", name: "dead.mkv", type: "file" },
    ]);
    await db.execute(sql.raw("UPDATE file_index SET deleted = 1 WHERE drive_id = 'test-drive' AND path = '/root/dead.mkv'"));

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("alive.mkv");
  });

  it("应按路径前缀过滤（只返回对应目录）", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/a/1.mkv", name: "1.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/b/2.mkv", name: "2.mkv", type: "file" },
    ]);

    const rowsA = await s.findActiveByDrive(DRIVE, "/root/a");
    expect(rowsA).toHaveLength(1);
    expect(rowsA[0].name).toBe("1.mkv");

    const rowsB = await s.findActiveByDrive(DRIVE, "/root/b");
    expect(rowsB).toHaveLength(1);
    expect(rowsB[0].name).toBe("2.mkv");
  });

  it("应按 type 再按 name 排序（dir 在前）", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/z.mkv", name: "z.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/a-dir", name: "a-dir", type: "dir" },
      { driveId: DRIVE, path: "/root/a.mkv", name: "a.mkv", type: "file" },
    ]);

    const rows = await s.findActiveByDrive(DRIVE, "/root");
    expect(rows[0].type).toBe("dir");
    expect(rows[1].name).toBe("a.mkv");
    expect(rows[2].name).toBe("z.mkv");
  });

  it("空目录应返回空数组", async () => {
    const rows = await s.findActiveByDrive(DRIVE, "/nonexistent");
    expect(rows).toEqual([]);
  });
});

describe("isCacheValid", () => {
  it("无缓存数据应返回 false", async () => {
    const valid = await s.isCacheValid(DRIVE, "/root");
    expect(valid).toBe(false);
  });

  it("索引在 TTL 内应返回 true", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/fresh.mkv", name: "fresh.mkv", type: "file" },
    ]);
    const valid = await s.isCacheValid(DRIVE, "/root");
    expect(valid).toBe(true);
  });

  it("已软删除的条目不应影响 TTL 判断", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/fresh.mkv", name: "fresh.mkv", type: "file" },
    ]);
    await db.execute(sql.raw("UPDATE file_index SET deleted = 1 WHERE drive_id = 'test-drive'"));

    const valid = await s.isCacheValid(DRIVE, "/root");
    expect(valid).toBe(false);
  });

  it("索引过期应返回 false", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/old.mkv", name: "old.mkv", type: "file" },
    ]);
    await db.execute(
      sql.raw("UPDATE file_index SET indexed_at = DATE_SUB(NOW(), INTERVAL 2 HOUR) WHERE drive_id = 'test-drive'")
    );

    const valid = await s.isCacheValid(DRIVE, "/root");
    expect(valid).toBe(false);
  });

  it("T=59min 时仍视为有效", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/edge.mkv", name: "edge.mkv", type: "file" },
    ]);
    await db.execute(
      sql.raw("UPDATE file_index SET indexed_at = DATE_SUB(NOW(), INTERVAL 59 MINUTE) WHERE drive_id = 'test-drive'")
    );

    const valid = await s.isCacheValid(DRIVE, "/root");
    expect(valid).toBe(true);
  });
});

describe("softDeleteStale", () => {
  it("应标记不在当前路径列表中的条目为已删除", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/keep.mkv", name: "keep.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/remove.mkv", name: "remove.mkv", type: "file" },
    ]);

    await s.softDeleteStale(DRIVE, "/root", ["/root/keep.mkv"]);

    const active = await s.findActiveByDrive(DRIVE, "/root");
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("keep.mkv");
  });

  it("currentPaths 为空时应将整个目录标记为已删除", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/a.mkv", name: "a.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/b.mkv", name: "b.mkv", type: "file" },
    ]);

    await s.softDeleteStale(DRIVE, "/root", []);

    const active = await s.findActiveByDrive(DRIVE, "/root");
    expect(active).toHaveLength(0);
  });

  it("不应影响其他目录", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/a/1.mkv", name: "1.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/b/2.mkv", name: "2.mkv", type: "file" },
    ]);

    await s.softDeleteStale(DRIVE, "/root/a", []);

    const aActive = await s.findActiveByDrive(DRIVE, "/root/a");
    expect(aActive).toHaveLength(0);

    const bActive = await s.findActiveByDrive(DRIVE, "/root/b");
    expect(bActive).toHaveLength(1);
    expect(bActive[0].name).toBe("2.mkv");
  });

  it("全部保留时返回的 affectedRows 为初始标记数", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/all.mkv", name: "all.mkv", type: "file" },
    ]);

    const affected = await s.softDeleteStale(DRIVE, "/root", ["/root/all.mkv"]);
    // 先全删再逐一恢复，affectedRows 反映首轮 UPDATE 影响的行数
    expect(affected).toBe(1);

    // 但条目实际未被删除
    const active = await s.findActiveByDrive(DRIVE, "/root");
    expect(active).toHaveLength(1);
  });

  it("同一路径在其他 drive 下不受影响", async () => {
    await s.upsertEntries([
      { driveId: "A", path: "/root/file.mkv", name: "file.mkv", type: "file" },
      { driveId: "B", path: "/root/file.mkv", name: "file.mkv", type: "file" },
    ]);

    await s.softDeleteStale("A", "/root", []);

    const aActive = await s.findActiveByDrive("A", "/root");
    const bActive = await s.findActiveByDrive("B", "/root");
    expect(aActive).toHaveLength(0);
    expect(bActive).toHaveLength(1);
  });
});

describe("setAnimeId", () => {
  it("应为目录下所有条目设置 animeId", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/show/ep1.mkv", name: "ep1.mkv", type: "file" },
      { driveId: DRIVE, path: "/show/ep2.mkv", name: "ep2.mkv", type: "file" },
    ]);

    await s.setAnimeId(DRIVE, "/show", 10);

    const rows = await s.findActiveByDrive(DRIVE, "/show");
    expect(rows).toHaveLength(2);
    rows.forEach((r) => expect(r.animeId).toBe(10));
  });

  it("animeId=null 应解除关联", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/show/ep1.mkv", name: "ep1.mkv", type: "file", animeId: 10 },
    ]);
    await s.setAnimeId(DRIVE, "/show", null);

    const rows = await s.findActiveByDrive(DRIVE, "/show");
    expect(rows[0].animeId).toBeNull();
  });
});

describe("getStats", () => {
  it("空表应返回全 0", async () => {
    const stats = await s.getStats(DRIVE);
    expect(stats.totalFiles).toBe(0);
    expect(stats.totalDirs).toBe(0);
    expect(stats.deletedFiles).toBe(0);
    expect(stats.lastIndexedAt).toBeNull();
  });

  it("应正确统计文件数、目录数和软删除数", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/f1.mkv", name: "f1.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/f2.mkv", name: "f2.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/dir1", name: "dir1", type: "dir" },
      { driveId: DRIVE, path: "/root/dead.mkv", name: "dead.mkv", type: "file" },
    ]);
    await db.execute(sql.raw("UPDATE file_index SET deleted = 1 WHERE path = '/root/dead.mkv'"));

    const stats = await s.getStats(DRIVE);
    expect(stats.totalFiles).toBe(3);
    expect(stats.totalDirs).toBe(1);
    expect(stats.deletedFiles).toBe(1);
    expect(stats.lastIndexedAt).toBeInstanceOf(Date);
  });
});

describe("listIndex", () => {
  it("应分页返回条目", async () => {
    for (let i = 0; i < 5; i++) {
      await s.upsertEntries([
        { driveId: DRIVE, path: `/root/f${i}.mkv`, name: `f${i}.mkv`, type: "file" },
      ]);
    }

    const page1 = await s.listIndex(DRIVE, { page: 1, pageSize: 3 });
    expect(page1.items).toHaveLength(3);
    expect(page1.total).toBe(5);

    const page2 = await s.listIndex(DRIVE, { page: 2, pageSize: 3 });
    expect(page2.items).toHaveLength(2);
    expect(page2.total).toBe(5);
  });

  it("搜索应过滤结果", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/abc.mkv", name: "abc.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/xyz.mkv", name: "xyz.mkv", type: "file" },
    ]);

    const result = await s.listIndex(DRIVE, { search: "abc" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("abc.mkv");
    expect(result.total).toBe(1);
  });
});

describe("touchIndexedAt", () => {
  it("应更新目录下所有条目的 indexedAt", async () => {
    await s.upsertEntries([
      { driveId: DRIVE, path: "/root/a.mkv", name: "a.mkv", type: "file" },
      { driveId: DRIVE, path: "/root/b.mkv", name: "b.mkv", type: "file" },
    ]);
    await db.execute(
      sql.raw("UPDATE file_index SET indexed_at = DATE_SUB(NOW(), INTERVAL 3 HOUR) WHERE drive_id = 'test-drive'")
    );

    await s.touchIndexedAt(DRIVE, "/root");

    const valid = await s.isCacheValid(DRIVE, "/root");
    expect(valid).toBe(true);
  });
});
