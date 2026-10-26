import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { fileIndex } from "../../../common/database/schema/file-index.js";
import { drives } from "../../../common/database/schema/drive.js";
import { log } from "../../../common/tools/logger.js";

/** 年目录: 2024 / 2024年 */
const YEAR_PATTERN = /^\d{4}(?:年)?$/;
/** 番剧目录名末尾的 Bangumi ID */
const BGMID_SUFFIX_PATTERN = /(\d+)\s*$/;
/** 番剧目录在 file_index 中的固定层级: /年/分类/番剧 */
const ANIME_DIR_DEPTH = 3;

const ANIME_TABLE_COLUMNS = {
  id: anime.id,
  year: anime.year,
  type: anime.type,
  name: anime.name,
  bgmid: anime.bgmid,
  title: anime.title,
  deleted: anime.deleted,
};

export interface AnimeDirectory {
  /** 归一化目录路径 /年/分类/番剧 */
  path: string;
  year: string;
  type: string;
  name: string;
  bgmid: string;
  title: string;
}

export interface AnimeRowRef {
  id: number;
  year: string;
  type: string;
  name: string;
  bgmid: string | null;
  title: string | null;
  deleted: number;
}

export interface UnmatchedDirectory {
  path: string;
  reason: string;
}

export interface LibrarySyncPreview {
  /** 索引中存在、但 anime 表中没有的番剧目录 */
  discovered: AnimeDirectory[];
  /** anime 表中已标记删除、但索引中目录仍存在的番剧 */
  restorable: AnimeRowRef[];
  /**
   * anime 表中有效、但索引中找不到目录的番剧。
   * 仅当该番剧所属的 年/分类 在所有 enabled drive 上都有活跃索引时才纳入,
   * 避免任一节点扫描失败或仅挂载部分内容时误判全库。
   */
  missing: AnimeRowRef[];
  /** 年目录下无法自动解析的目录 */
  unmatched: UnmatchedDirectory[];
  /** 参与识别的有效目录总数（跨 drive 去重） */
  directoryCount: number;
  /** 存在可安全判定缺失的 年/分类 时才允许标记删除 */
  canMarkMissing: boolean;
}

export interface LibrarySyncApplyOptions {
  /** 默认 false: 不自动删除, 仅报告 missing; 管理员显式开启后才标记 deleted */
  markMissing?: boolean;
}

export interface LibrarySyncApplyResult {
  inserted: number;
  restored: number;
  markedMissing: number;
  preview: LibrarySyncPreview;
}

export class LibrarySyncRejectedError extends Error {}

let applying = false;

/**
 * 从番剧目录路径解析 year / type / name / bgmid / title。
 * 只接受 /年/分类/番剧名+末尾数字 的固定结构。
 */
export function parseAnimeDirectory(path: string): AnimeDirectory | null {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  if (segments.length !== ANIME_DIR_DEPTH) return null;

  const [year, type, name] = segments;
  if (!YEAR_PATTERN.test(year)) return null;

  const match = name.match(BGMID_SUFFIX_PATTERN);
  if (!match) return null;

  // 保留原始数字串: 生产库用 000000 作为非 Bangumi 作品哨兵
  const bgmid = match[1];

  const suffixIndex = match.index ?? name.length - match[0].length;
  const title = name.slice(0, suffixIndex).trim();
  if (!title) return null;

  return { path: `/${year}/${type}/${name}`, year, type, name, bgmid, title };
}

/**
 * 对比 file_index 中的番剧目录与 anime 表, 生成识别结果。
 * 只使用 enabled drive 的活跃目录; 不写库。
 */
export async function previewLibrarySync(): Promise<LibrarySyncPreview> {
  const indexRows = await listIndexedAnimeDirectories();
  const enabledDriveIDs = await listEnabledDriveIDs();
  const pathSet = new Set(indexRows.map((row) => row.path));
  const groupDrives = new Map<string, Set<string>>();
  const directoryKeys = new Set<string>();
  const candidates = new Map<string, AnimeDirectory>();
  const unmatched: UnmatchedDirectory[] = [];

  for (const row of indexRows) {
    const segments = row.path.split("/").filter((segment) => segment.length > 0);
    if (segments.length !== ANIME_DIR_DEPTH) continue;

    const [year, type, name] = segments;
    const group = `${year}/${type}`;
    let driveSet = groupDrives.get(group);
    if (!driveSet) {
      driveSet = new Set<string>();
      groupDrives.set(group, driveSet);
    }
    driveSet.add(row.driveId);
    directoryKeys.add(`${group}/${name}`);

    const candidate = parseAnimeDirectory(row.path);
    if (candidate) {
      const key = `${candidate.year}/${candidate.type}/${candidate.name}`;
      if (!candidates.has(key)) candidates.set(key, candidate);
      continue;
    }

    // 只报告看起来像年份目录下的问题目录, 避免根目录其他分类产生噪音
    if (YEAR_PATTERN.test(year)) {
      unmatched.push({ path: row.path, reason: explainUnmatchedDirectory(name) });
    }
  }

  /**
   * 只有所有启用节点都覆盖到的 年/分类 才适合判定缺失。
   * 多节点中任一节点索引不完整（如扫描失败、仅挂载部分内容）时, 该分类不参与缺失判断。
   */
  const completeGroups = new Set<string>();
  for (const [group, driveSet] of groupDrives) {
    if (enabledDriveIDs.length > 0 && driveSet.size >= enabledDriveIDs.length) {
      completeGroups.add(group);
    }
  }

  const rows = (await db.select(ANIME_TABLE_COLUMNS).from(anime)) as AnimeRowRef[];
  const rowByKey = new Map(
    rows.map((row) => [`${row.year}/${row.type}/${row.name}`, row])
  );

  const discovered: AnimeDirectory[] = [];
  for (const [key, candidate] of candidates) {
    if (!rowByKey.has(key)) discovered.push(candidate);
  }

  const restorable: AnimeRowRef[] = [];
  const missing: AnimeRowRef[] = [];
  const activeKeys = new Set<string>();
  for (const row of rows) {
    if (row.deleted === 0) activeKeys.add(`${row.year}/${row.type}/${row.name}`);
  }

  const restorableKeys = new Set<string>();
  for (const row of rows) {
    const key = `${row.year}/${row.type}/${row.name}`;
    if (directoryKeys.has(key)) {
      // 同一 key 已有有效行时, 不自动恢复历史重复行
      if (row.deleted === 1 && !activeKeys.has(key) && !restorableKeys.has(key)) {
        restorable.push(row);
        restorableKeys.add(key);
      }
      continue;
    }

    if (row.deleted === 0 && completeGroups.has(`${row.year}/${row.type}`)) {
      missing.push(row);
    }
  }

  discovered.sort((a, b) => a.path.localeCompare(b.path));
  restorable.sort((a, b) => a.id - b.id);
  missing.sort((a, b) => a.id - b.id);
  unmatched.sort((a, b) => a.path.localeCompare(b.path));

  return {
    discovered,
    restorable,
    missing,
    unmatched,
    directoryCount: pathSet.size,
    canMarkMissing: completeGroups.size > 0,
  };
}

/**
 * 执行识别结果: 新建番剧、恢复软删除番剧, 可选标记缺失番剧为已删除。
 * 默认不删除任何内容。
 */
export async function applyLibrarySync(
  options: LibrarySyncApplyOptions = {}
): Promise<LibrarySyncApplyResult> {
  if (applying) {
    throw new LibrarySyncRejectedError("已有识别任务正在执行");
  }

  const markMissing = options.markMissing === true;
  applying = true;
  try {
    const preview = await previewLibrarySync();

    if (markMissing && !preview.canMarkMissing) {
      throw new LibrarySyncRejectedError(
        "没有可安全判定缺失的分类，需所有启用节点的该分类索引都完整"
      );
    }

    let inserted = 0;
    for (const directory of preview.discovered) {
      // 再次确认, 避免并发任务在 preview 后插入相同目录
      const existing = await findAnimeRow(directory);
      if (existing) continue;

      await db.insert(anime).values({
        year: directory.year,
        type: directory.type,
        name: directory.name,
        bgmid: directory.bgmid,
        title: directory.title,
        deleted: 0,
      });
      inserted++;
      log.info(
        `[番剧识别] 新入库 ${directory.year}/${directory.type}/${directory.name} (bgm${directory.bgmid})`
      );
    }

    let restored = 0;
    for (const row of preview.restorable) {
      await db.update(anime).set({ deleted: 0 }).where(eq(anime.id, row.id));
      restored++;
      log.info(`[番剧识别] 恢复番剧 ${row.name} (laID ${row.id})`);
    }

    let markedMissing = 0;
    if (markMissing) {
      for (const row of preview.missing) {
        await db.update(anime).set({ deleted: 1 }).where(eq(anime.id, row.id));
        markedMissing++;
        log.info(`[番剧识别] 标记删除 ${row.name} (laID ${row.id})`);
      }
    }

    if (inserted || restored || markedMissing) {
      log.info(
        `[番剧识别] 完成: 新增 ${inserted}, 恢复 ${restored}, 标记删除 ${markedMissing}`
      );
    } else {
      log.info("[番剧识别] 完成: 无变更");
    }

    return { inserted, restored, markedMissing, preview };
  } finally {
    applying = false;
  }
}

async function listIndexedAnimeDirectories(): Promise<Array<{ driveId: string; path: string }>> {
  const rows = await db
    .select({ driveId: fileIndex.driveId, path: fileIndex.path })
    .from(fileIndex)
    .innerJoin(drives, eq(fileIndex.driveId, drives.id))
    .where(
      and(
        eq(fileIndex.type, "dir"),
        eq(fileIndex.deleted, 0),
        eq(drives.enabled, 1),
        sql`CHAR_LENGTH(${fileIndex.path}) - CHAR_LENGTH(REPLACE(${fileIndex.path}, '/', '')) = ${ANIME_DIR_DEPTH}`
      )
    );

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.driveId}\u0000${row.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function listEnabledDriveIDs(): Promise<string[]> {
  const rows = await db
    .select({ id: drives.id })
    .from(drives)
    .where(eq(drives.enabled, 1));

  return rows.map((row) => row.id);
}

async function findAnimeRow(directory: AnimeDirectory): Promise<AnimeRowRef | null> {
  const rows = (await db
    .select(ANIME_TABLE_COLUMNS)
    .from(anime)
    .where(
      and(
        eq(anime.year, directory.year),
        eq(anime.type, directory.type),
        eq(anime.name, directory.name)
      )
    )
    .limit(1)) as AnimeRowRef[];

  return rows[0] ?? null;
}

function explainUnmatchedDirectory(name: string): string {
  if (!BGMID_SUFFIX_PATTERN.test(name)) {
    return "目录名未以 Bangumi ID 数字结尾";
  }
  return "目录名缺少可用的标题部分";
}
