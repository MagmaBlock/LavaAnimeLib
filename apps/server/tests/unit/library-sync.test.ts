import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../../common/database/connection.js";
import { anime } from "../../common/database/schema/anime.js";
import * as fileIndexService from "../../services/v2/anime/file-index.js";
import {
  applyLibrarySync,
  LibrarySyncRejectedError,
  parseAnimeDirectory,
  previewLibrarySync,
} from "../../services/v2/anime/library-sync.js";

const DRIVE = "1A";
const DISABLED_DRIVE = "2B";
const TEST_YEAR = "2099年";
const DISABLED_YEAR = "2098年";

async function cleanup() {
  await db.execute(sql.raw("DELETE FROM file_index"));
  await db.execute(
    sql.raw(
      `DELETE FROM anime WHERE year IN ('${TEST_YEAR}', '${DISABLED_YEAR}')`
    )
  );
  await db.execute(sql.raw("UPDATE drives SET enabled = 0 WHERE id = '2B'"));
}

async function seedAnime(values: {
  year: string;
  type: string;
  name: string;
  bgmid: string | null;
  title: string | null;
  deleted?: number;
}) {
  await db.insert(anime).values({
    year: values.year,
    type: values.type,
    name: values.name,
    bgmid: values.bgmid,
    title: values.title,
    deleted: values.deleted ?? 0,
  });
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
      driveId: DISABLED_DRIVE,
      path: `/${DISABLED_YEAR}/1月冬/禁用番剧 990003`,
      name: "禁用番剧 990003",
      type: "dir",
    },
  ]);
}

beforeEach(cleanup);
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
    });
  });

  it("无末尾数字、层级不符或年份不合法时应返回 null", () => {
    expect(parseAnimeDirectory("/2026年/1月冬/测试番剧")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬/测试番剧 123456/extra")).toBeNull();
    expect(parseAnimeDirectory("/其他/1月冬/测试番剧 123456")).toBeNull();
    expect(parseAnimeDirectory("/2026年/1月冬/ 123456")).toBeNull();
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
    expect(preview.directoryCount).toBe(4);
    expect(preview.canMarkMissing).toBe(true);
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

  it("索引为空时不应把整库判为缺失, 且禁止标记删除", async () => {
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
    await db.execute(sql.raw("UPDATE drives SET enabled = 1 WHERE id = '2B'"));
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

  it("所有启用节点都覆盖同一分类时才判定缺失", async () => {
    await db.execute(sql.raw("UPDATE drives SET enabled = 1 WHERE id = '2B'"));
    await seedIndex();
    await fileIndexService.upsertEntries([
      {
        driveId: DISABLED_DRIVE,
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
    expect(preview.canMarkMissing).toBe(true);
  });
});

describe("applyLibrarySync", () => {
  it("应新增番剧并恢复软删除记录, 默认不标记缺失", async () => {
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
    expect(inserted?.deleted).toBe(0);

    expect(rows.find((row) => row.bgmid === "990002")?.deleted).toBe(0);
    expect(rows.find((row) => row.bgmid === "990004")?.deleted).toBe(0);

    const again = await applyLibrarySync();
    expect(again.inserted).toBe(0);
    expect(again.restored).toBe(0);
  });

  it("markMissing=true 时应标记缺失番剧为已删除", async () => {
    await seedIndex();
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "已消失番剧 990004",
      bgmid: "990004",
      title: "已消失番剧",
    });

    const result = await applyLibrarySync({ markMissing: true });

    expect(result.markedMissing).toBe(1);

    const rows = (await db
      .select()
      .from(anime)
      .where(sql`${anime.year} = ${TEST_YEAR}`)) as Array<
      typeof anime.$inferSelect
    >;
    expect(rows.find((row) => row.bgmid === "990004")?.deleted).toBe(1);
  });

  it("索引为空时 markMissing=true 应拒绝执行", async () => {
    await seedAnime({
      year: TEST_YEAR,
      type: "1月冬",
      name: "库内番剧 990006",
      bgmid: "990006",
      title: "库内番剧",
    });

    await expect(applyLibrarySync({ markMissing: true })).rejects.toBeInstanceOf(
      LibrarySyncRejectedError
    );

    const rows = (await db
      .select()
      .from(anime)
      .where(sql`${anime.year} = ${TEST_YEAR}`)) as Array<
      typeof anime.$inferSelect
    >;
    expect(rows[0]?.deleted).toBe(0);
  });
});
