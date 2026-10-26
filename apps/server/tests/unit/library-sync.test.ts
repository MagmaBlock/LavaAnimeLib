import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "../../common/database/connection.js";
import { anime } from "../../common/database/schema/anime.js";
import { drives } from "../../common/database/schema/drive.js";
import { subjects } from "../../common/database/schema/bangumi-subjects.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import {
  applyLibrarySync,
  LibrarySyncRejectedError,
  parseAnimeDirectory,
  previewLibrarySync,
} from "../../services/v2/anime/library-sync.js";

const DRIVE = "1A";
const SECOND_DRIVE = "2B";
const TEST_YEAR = "2099年";
const OTHER_YEAR = "2098年";

async function cleanup() {
  await db.execute(sql.raw("DELETE FROM file_index"));
  await db.execute(
    sql.raw(
      `DELETE FROM anime WHERE year IN ('${TEST_YEAR}', '${OTHER_YEAR}')`
    )
  );
  await db.execute(
    sql.raw(
      "DELETE FROM bangumi_subjects WHERE bgmid = 0 OR bgmid BETWEEN 990000 AND 990999"
    )
  );
  await db.execute(
    sql.raw(
      "UPDATE drives SET enabled = IF(id = '1A', 1, 0), library_sync = 1, last_scan_at = NULL, last_scan_ok = NULL, last_scan_rows = NULL WHERE id IN ('1A', '2B')"
    )
  );
}

async function markScanHealthy(
  driveId: string,
  options: { ok?: 0 | 1; hoursAgo?: number; rows?: number } = {}
) {
  const { ok = 1, hoursAgo = 0, rows = 4 } = options;
  await db
    .update(drives)
    .set({
      lastScanAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      lastScanOk: ok,
      lastScanRows: rows,
    })
    .where(eq(drives.id, driveId));
}

async function enableLibraryDrive(driveId: string) {
  await db
    .update(drives)
    .set({ enabled: 1, librarySync: 1 })
    .where(eq(drives.id, driveId));
  await markScanHealthy(driveId);
}

async function seedAnime(values: {
  year: string;
  type: string;
  name: string;
  bgmid: string | null;
  title: string | null;
  deleted?: number;
  nsfw?: number;
}) {
  await db.insert(anime).values({
    year: values.year,
    type: values.type,
    name: values.name,
    bgmid: values.bgmid,
    title: values.title,
    deleted: values.deleted ?? 0,
    nsfw: values.nsfw ?? 0,
  });
}

async function seedSubject(values: {
  bgmid: number;
  name: string;
  nameCn?: string | null;
  nsfw?: number;
}) {
  await db.insert(subjects).values({
    bgmid: values.bgmid,
    name: values.name,
    name_cn: values.nameCn ?? null,
    nsfw: values.nsfw ?? 0,
  });
}

async function seedIndexDir(path: string, driveId = DRIVE) {
  const name = path.split("/").filter((segment) => segment.length > 0).pop()!;
  await fileIndexService.upsertEntries([
    { driveId, path, name, type: "dir" },
  ]);
}

async function countAnime(year = TEST_YEAR): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(anime)
    .where(eq(anime.year, year));
  return Number(row.count);
}

async function seedIndex() {
  await fileIndexService.upsertEntries([
    {
      driveId: DRIVE,
      path: `/${TEST_YEAR}/1月冬/新番剧 990001`,
      name: "新番剧 990001",
      type: "dir",
    },
    {
      driveId: DRIVE,
      path: `/${TEST_YEAR}/1月冬/恢复番剧 990002`,
      name: "恢复番剧 990002",
      type: "dir",
    },
    {
      driveId: DRIVE,
      path: `/${TEST_YEAR}/1月冬/已存在番剧 990005`,
      name: "已存在番剧 990005",
      type: "dir",
    },
    {
      driveId: DRIVE,
      path: `/${TEST_YEAR}/1月冬/无法识别`,
      name: "无法识别",
      type: "dir",
    },
    {
      driveId: DRIVE,
      path: `/${TEST_YEAR}/1月冬/新番剧 990001/ep01.mkv`,
      name: "ep01.mkv",
      type: "file",
      size: 100,
    },
    {
      driveId: DRIVE,
      path: `/${TEST_YEAR}/1月冬/已存在番剧 990005/ep01.mkv`,
      name: "ep01.mkv",
      type: "file",
      size: 100,
    },
    {
      driveId: SECOND_DRIVE,
      path: `/${OTHER_YEAR}/1月冬/禁用番剧 990003`,
      name: "禁用番剧 990003",
      type: "dir",
    },
  ]);
}

beforeEach(async () => {
  await cleanup();
  await markScanHealthy(DRIVE);
});

afterEach(cleanup);

describe("parseAnimeDirectory", () => {
  it("应解析 /年/分类/番剧+末尾数字", () => {
    expect(parseAnimeDirectory("/2026年/1月冬/测试番剧 123456")).toEqual({
      path: "/2026年/1月冬/测试番剧 123456",
      year: "2026年",
      type: "1月冬",
      name: "测试番剧 123456",
      bgmid: "123456",
      title: "测试番剧",
      nsfw: 0,
    });
  });

  it("应接受不带“年”字的四位年份", () => {
    expect(parseAnimeDirectory("/2026/1月冬/测试番剧 123456")?.year).toBe(
      "2026"
    );
  });

  it("应保留末尾数字的原始形式（000000 哨兵）", () => {
    expect(parseAnimeDirectory("/2014年/其他地区/星际穿越 Interstellar 000000")).toEqual({
      path: "/2014年/其他地区/星际穿越 Interstellar 000000",
      year: "2014年",
      type: "其他地区",
      name: "星际穿越 Interstellar 000000",
      bgmid: "000000",
      title: "星际穿越 Interstellar",
      nsfw: 0,
    });
  });

  it("应解析并剥离 [NSFW]（大小写不敏感）", () => {
    const upper = parseAnimeDirectory("/2024年/1月冬/梦想成为魔法少女 [NSFW] 424663");
    expect(upper?.nsfw).toBe(1);
    expect(upper?.title).toBe("梦想成为魔法少女");

    const lower = parseAnimeDirectory("/2024年/1月冬/某番 [nsfw] 123");
    expect(lower?.nsfw).toBe(1);
    expect(lower?.title).toBe("某番");
  });

  it("应剥离技术标记并折叠空白，但保留其它方括号内容", () => {
    expect(
      parseAnimeDirectory("/2024年/1月冬/少女革命 [BDRip] 1453")?.title
    ).toBe("少女革命");
    expect(
      parseAnimeDirectory(
        "/2024年/1月冬/恋爱小行星  Koisuru Asteroid [BDRip][Ma10p] 276150"
      )?.title
    ).toBe("恋爱小行星 Koisuru Asteroid");
    expect(
      parseAnimeDirectory("/2024年/1月冬/某番 [剧场版][BDRip] 123")?.title
    ).toBe("某番 [剧场版]");
  });

  it("无末尾数字、层级不符或年份不合法时应返回 null", () => {
    expect(parseAnimeDirectory("/2026年/1月冬/测试番剧")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬/测试番剧 123456/extra")).toBeNull();
    expect(parseAnimeDirectory("/其他/1月冬/测试番剧 123456")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬/ 123456")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬/[BDRip] 123")).toBeNull();
  });
});

describe("previewLibrarySync", () => {
  it("应识别新增、可恢复、缺失与无法解析的目录", async () => {
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "恢复番剧 990002",
      bgmid: "990002",
      title: "恢复番剧",
      deleted: 1,
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已存在番剧 990005",
      bgmid: "990005",
      title: "已存在番剧",
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });

    const preview = await previewLibrarySync();

    expect(preview.discovered.map((item) => item.bgmid)).toEqual(["990001"]);
    expect(preview.restorable.map((row) => row.bgmid)).toEqual(["990002"]);
    expect(preview.missing.map((row) => row.bgmid)).toEqual(["990004"]);
    expect(preview.unmatched.map((item) => item.path)).toEqual([
      `/${TEST_YEAR}/1月冬/无法识别`,
    ]);
    expect(preview.unmatched[0].driveIds).toEqual([DRIVE]);
    expect(preview.directoryCount).toBe(4);
    expect(preview.canMarkMissing).toBe(false);
    expect(preview.scanHealthy).toBe(true);
    expect(preview.blockedReason).toBeNull();
    expect(preview.canApply).toBe(true);
  });

  it("不应识别禁用 drive 的目录", async () => {
    await seedIndex();

    const preview = await previewLibrarySync();

    expect(preview.discovered.map((item) => item.bgmid).sort()).toEqual([
      "990001",
      "990002",
      "990005",
    ]);
    expect(preview.discovered.some((item) => item.bgmid === "990003")).toBe(false);
  });

  it("enabled 但 library_sync=0 的节点不参与识别与覆盖判定", async () => {
    await enableLibraryDrive(SECOND_DRIVE);
    await db
      .update(drives)
      .set({ librarySync: 0, lastScanOk: 0, lastScanRows: 0 })
      .where(eq(drives.id, SECOND_DRIVE));
    await seedIndex();
    await seedAnime({
      year: OTHER_YEAR,
      type: "1月冬",
      name: "非库节点番剧 990003",
      bgmid: "990003",
      title: "非库节点番剧",
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });

    const preview = await previewLibrarySync();

    expect(preview.discovered.some((item) => item.bgmid === "990003")).toBe(false);
    // 2098 的目录只存在于非库节点, 不构成缺失覆盖
    expect(preview.missing.map((row) => row.bgmid)).toEqual(["990004"]);
    // 非库节点扫描失败不应阻塞库节点
    expect(preview.scanHealthy).toBe(true);
    expect(preview.canApply).toBe(true);
  });

  it("同 key 已有有效番剧时不应自动恢复重复的已删除行", async () => {
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已存在番剧 990005",
      bgmid: "990005",
      title: "已存在番剧",
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已存在番剧 990005",
      bgmid: "990005",
      title: "已存在番剧",
      deleted: 1,
    });

    const preview = await previewLibrarySync();
    expect(preview.restorable).toEqual([]);

    const result = await applyLibrarySync();
    expect(result.restored).toBe(0);
  });

  it("仅空白差异的同一番剧应命中同一 key，不应重复发现或恢复", async () => {
    await seedIndexDir(`/${TEST_YEAR}/1月冬/空白番剧 990010`);
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "空白番剧  990010",
      bgmid: "990010",
      title: "空白番剧",
    });

    const preview = await previewLibrarySync();

    expect(preview.discovered).toEqual([]);
    expect(preview.restorable).toEqual([]);

    const result = await applyLibrarySync();
    expect(result.inserted).toBe(0);
    expect(await countAnime()).toBe(1);
  });

  it("同一 key 的重复行中应优先有效行，不恢复已删除行", async () => {
    await seedIndexDir(`/${TEST_YEAR}/1月冬/重复番剧 990011`);
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "重复番剧  990011",
      bgmid: "990011",
      title: "重复番剧",
      deleted: 1,
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "重复番剧 990011",
      bgmid: "990011",
      title: "重复番剧",
    });

    const preview = await previewLibrarySync();
    expect(preview.restorable).toEqual([]);

    const result = await applyLibrarySync();
    expect(result.restored).toBe(0);
  });

  it("同一 bgmid 已存在于不同名称时不应自动插入", async () => {
    await seedIndexDir(`/${TEST_YEAR}/1月冬/改名后的番剧 990008`);
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "旧名字 990008",
      bgmid: "990008",
      title: "旧名字",
    });

    const preview = await previewLibrarySync();

    expect(preview.discovered.some((item) => item.bgmid === "990008")).toBe(false);
    const conflict = preview.unmatched.find(
      (item) => item.path === `/${TEST_YEAR}/1月冬/改名后的番剧 990008`
    );
    expect(conflict?.reason).toContain("990008");
    expect(conflict?.reason).toContain("人工");

    const result = await applyLibrarySync();
    expect(result.inserted).toBe(0);
    expect(await countAnime()).toBe(1);
  });

  it("unmatched 应按 path 跨节点去重并记录 driveIds", async () => {
    await enableLibraryDrive(SECOND_DRIVE);
    const path = `/${TEST_YEAR}/1月冬/无法识别`;
    await seedIndexDir(path, DRIVE);
    await seedIndexDir(path, SECOND_DRIVE);

    const preview = await previewLibrarySync();

    expect(preview.unmatched).toHaveLength(1);
    expect(preview.unmatched[0].path).toBe(path);
    expect(preview.unmatched[0].driveIds).toEqual([DRIVE, SECOND_DRIVE]);
  });

  it("索引为空时不应把整库判为缺失", async () => {
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "库内番剧 990006",
      bgmid: "990006",
      title: "库内番剧",
    });

    const preview = await previewLibrarySync();

    expect(preview.missing).toEqual([]);
    expect(preview.directoryCount).toBe(0);
    expect(preview.canMarkMissing).toBe(false);
  });

  it("多节点中任一节点缺少该分类时不应判定缺失", async () => {
    await enableLibraryDrive(SECOND_DRIVE);
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });

    const preview = await previewLibrarySync();

    expect(preview.missing).toEqual([]);
    expect(preview.canMarkMissing).toBe(false);
  });

  it("所有库节点都覆盖同一分类时才判定缺失（但标记删除仍关闭）", async () => {
    await enableLibraryDrive(SECOND_DRIVE);
    await seedIndex();
    await fileIndexService.upsertEntries([
      {
        driveId: SECOND_DRIVE,
        path: `/${TEST_YEAR}/1月冬/另一节点番剧 990007`,
        name: "另一节点番剧 990007",
        type: "dir",
      },
    ]);
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });

    const preview = await previewLibrarySync();

    expect(preview.missing.map((row) => row.bgmid)).toEqual(["990004"]);
    expect(preview.canMarkMissing).toBe(false);
  });

  it("扫描失败时 canApply=false，但 missing 仍用于诊断", async () => {
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });
    await markScanHealthy(DRIVE, { ok: 0, rows: 0 });

    const preview = await previewLibrarySync();

    expect(preview.scanHealthy).toBe(false);
    expect(preview.canApply).toBe(false);
    expect(preview.canMarkMissing).toBe(false);
    expect(preview.blockedReason).toContain(DRIVE);
    expect(preview.blockedReason).toContain("失败");
    expect(preview.missing.map((row) => row.bgmid)).toEqual(["990004"]);
  });

  it("索引超过 24 小时未更新时 canApply=false", async () => {
    await seedIndex();
    await markScanHealthy(DRIVE, { hoursAgo: 25 });

    const preview = await previewLibrarySync();

    expect(preview.scanHealthy).toBe(false);
    expect(preview.canApply).toBe(false);
    expect(preview.blockedReason).toContain("24 小时");
    expect(preview.blockedReason).toContain(DRIVE);
  });

  it("尚未扫描（last_scan_at 为空）时 canApply=false", async () => {
    await seedIndex();
    await db
      .update(drives)
      .set({ lastScanAt: null, lastScanOk: null, lastScanRows: null })
      .where(eq(drives.id, DRIVE));

    const preview = await previewLibrarySync();

    expect(preview.scanHealthy).toBe(false);
    expect(preview.blockedReason).toContain("尚未完成扫描");
  });

  it("没有库范围节点时 canApply=false", async () => {
    await db
      .update(drives)
      .set({ librarySync: 0 })
      .where(eq(drives.id, DRIVE));

    const preview = await previewLibrarySync();

    expect(preview.scanHealthy).toBe(false);
    expect(preview.canApply).toBe(false);
    expect(preview.blockedReason).toContain("没有启用");
  });
});

describe("applyLibrarySync", () => {
  it("应新增番剧并恢复软删除记录", async () => {
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "恢复番剧 990002",
      bgmid: "990002",
      title: "恢复番剧",
      deleted: 1,
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已存在番剧 990005",
      bgmid: "990005",
      title: "已存在番剧",
    });
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });

    const result = await applyLibrarySync();

    expect(result.inserted).toBe(1);
    expect(result.restored).toBe(1);
    expect(result.markedMissing).toBe(0);

    const rows = (await db
      .select()
      .from(anime)
      .where(sql`${anime.year} = ${TEST_YEAR}`)) as Array<
      typeof anime.$inferSelect
    >;
    const inserted = rows.find((row) => row.bgmid === "990001");
    expect(inserted).toBeDefined();
    expect(inserted?.name).toBe("新番剧 990001");
    expect(inserted?.title).toBe("新番剧");
    expect(inserted?.nsfw).toBe(0);
    expect(inserted?.deleted).toBe(0);

    expect(rows.find((row) => row.bgmid === "990002")?.deleted).toBe(0);
    expect(rows.find((row) => row.bgmid === "990004")?.deleted).toBe(0);

    const again = await applyLibrarySync();
    expect(again.inserted).toBe(0);
    expect(again.restored).toBe(0);
  });

  it("扫描不健康时应在写入前拒绝", async () => {
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "恢复番剧 990002",
      bgmid: "990002",
      title: "恢复番剧",
      deleted: 1,
    });
    await markScanHealthy(DRIVE, { ok: 0, rows: 0 });
    const before = await countAnime();

    await expect(applyLibrarySync()).rejects.toBeInstanceOf(
      LibrarySyncRejectedError
    );

    expect(await countAnime()).toBe(before);
    const rows = (await db
      .select()
      .from(anime)
      .where(eq(anime.year, TEST_YEAR))) as Array<typeof anime.$inferSelect>;
    expect(rows.find((row) => row.bgmid === "990001")).toBeUndefined();
    expect(rows.find((row) => row.bgmid === "990002")?.deleted).toBe(1);
  });

  it("markMissing=true 应始终拒绝且不产生任何写入", async () => {
    await seedIndex();
    const before = await countAnime();

    await expect(
      applyLibrarySync({ markMissing: true })
    ).rejects.toThrow("缺失标记暂未开放");

    expect(await countAnime()).toBe(before);
  });

  it("应按 bgmid 批量读取 Bangumi 缓存并使用中文标题与 nsfw", async () => {
    await seedIndexDir(`/${TEST_YEAR}/1月冬/目录名 [BDRip] 990020`);
    await seedIndexDir(`/${TEST_YEAR}/1月冬/第二部 990021`);
    await seedSubject({
      bgmid: 990020,
      name: "Romaji Title",
      nameCn: "中文标题",
      nsfw: 1,
    });
    await seedSubject({
      bgmid: 990021,
      name: "Fallback Romaji",
      nameCn: null,
    });

    const preview = await previewLibrarySync();
    expect(preview.discovered).toHaveLength(2);
    const first = preview.discovered.find((item) => item.bgmid === "990020")!;
    expect(first.title).toBe("中文标题");
    expect(first.nsfw).toBe(1);
    expect(first.name).toBe("目录名 [BDRip] 990020");
    const second = preview.discovered.find((item) => item.bgmid === "990021")!;
    expect(second.title).toBe("Fallback Romaji");
    expect(second.nsfw).toBe(0);

    const result = await applyLibrarySync();
    expect(result.inserted).toBe(2);

    const rows = (await db
      .select()
      .from(anime)
      .where(eq(anime.year, TEST_YEAR))) as Array<typeof anime.$inferSelect>;
    const inserted = rows.find((row) => row.bgmid === "990020")!;
    expect(inserted.name).toBe("目录名 [BDRip] 990020");
    expect(inserted.title).toBe("中文标题");
    expect(inserted.nsfw).toBe(1);
  });

  it("[NSFW] 目录应入库 nsfw=1，回退标题剥离技术标记", async () => {
    await seedIndexDir(
      `/${TEST_YEAR}/1月冬/恋爱小行星 [NSFW][BDRip][Ma10p] 990022`
    );

    const preview = await previewLibrarySync();
    const item = preview.discovered[0];
    expect(item.title).toBe("恋爱小行星");
    expect(item.nsfw).toBe(1);

    await applyLibrarySync();

    const [row] = (await db
      .select()
      .from(anime)
      .where(eq(anime.year, TEST_YEAR))) as Array<typeof anime.$inferSelect>;
    expect(row.nsfw).toBe(1);
    expect(row.title).toBe("恋爱小行星");
    expect(row.name).toBe("恋爱小行星 [NSFW][BDRip][Ma10p] 990022");
  });

  it("000000 哨兵不应查询 Bangumi 缓存", async () => {
    await seedSubject({ bgmid: 0, name: "Should Not Use", nameCn: "不应使用" });
    await seedIndexDir(
      `/${TEST_YEAR}/其他地区/星际穿越 Interstellar 000000`
    );

    const preview = await previewLibrarySync();

    expect(preview.discovered[0].title).toBe("星际穿越 Interstellar");
    expect(preview.discovered[0].nsfw).toBe(0);

    await applyLibrarySync();
    const [row] = (await db
      .select()
      .from(anime)
      .where(eq(anime.year, TEST_YEAR))) as Array<typeof anime.$inferSelect>;
    expect(row.bgmid).toBe("000000");
    expect(row.title).toBe("星际穿越 Interstellar");
  });
});
