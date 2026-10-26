import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { fileIndex } from "../../../common/database/schema/file-index.js";
import { drives } from "../../../common/database/schema/drive.js";
import { subjects } from "../../../common/database/schema/bangumi-subjects.js";
import { log } from "../../../common/tools/logger.js";

/** 年目录: 2024 / 2024年 */
const YEAR_PATTERN = /^\d{4}(?:年)?$/;
/** 番剧目录名末尾的 Bangumi ID */
const BGMID_SUFFIX_PATTERN = /(\d+)\s*$/;
/** 番剧目录在 file_index 中的固定层级: /年/分类/番剧 */
const ANIME_DIR_DEPTH = 3;

/** 非 Bangumi 作品的哨兵 ID, 不参与 Bangumi 缓存查询与同 ID 冲突检查 */
const SENTINEL_BGMID = "000000";
/** 扫描健康阈值: 超过 24 小时视为陈旧 */
const SCAN_FRESH_MS = 24 * 60 * 60 * 1000;
const INSERT_BATCH_SIZE = 500;

/** 可从目录名标题中剥离的技术标记; 只列白名单, 保留其它方括号内容 */
const TECHNICAL_TAG_PATTERN =
  /\[(?:NSFW|BDRip|Ma10p|WEBRip|HEVC|10bit|1080p|2160p)\]/gi;
const NSFW_TAG_PATTERN = /\[NSFW\]/i;

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
  nsfw: 0 | 1;
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
  /** 该路径出现在哪些存储节点的索引中 */
  driveIds: string[];
}

export interface LibrarySyncPreview {
  /** 索引中存在、但 anime 表中没有的番剧目录 */
  discovered: AnimeDirectory[];
  /** anime 表中已标记删除、但索引中目录仍存在的番剧 */
  restorable: AnimeRowRef[];
  /**
   * anime 表中有效、但索引中找不到目录的番剧（仅诊断）。
   * 仅当该番剧所属的 年/分类 被所有 enabled + library_sync 节点覆盖时才纳入。
   */
  missing: AnimeRowRef[];
  /** 年目录下无法自动解析、或同 bgmid 冲突的目录（按 path 跨节点去重） */
  unmatched: UnmatchedDirectory[];
  /** 参与识别的有效目录总数（跨 drive 去重） */
  directoryCount: number;
  /** 预留字段: 当前阶段缺失标记始终关闭 */
  canMarkMissing: boolean;
  /** 所有 enabled + library_sync 节点最近一次扫描是否成功且新鲜 */
  scanHealthy: boolean;
  /** scanHealthy=false 时的人类可读原因 */
  blockedReason: string | null;
  /** 仅当 scanHealthy=true 时允许执行入库 */
  canApply: boolean;
}

export interface LibrarySyncApplyOptions {
  /**
   * 兼容旧管理端请求。当前阶段固定关闭：传 true 会直接拒绝，不产生任何写入。
   */
  markMissing?: boolean;
}

export interface LibrarySyncApplyResult {
  inserted: number;
  restored: number;
  markedMissing: number;
  preview: LibrarySyncPreview;
}

export class LibrarySyncRejectedError extends Error {}

interface LibraryDriveHealthRow {
  id: string;
  lastScanAt: Date | null;
  lastScanOk: number | null;
  lastScanRows: number | null;
}

interface SubjectMetadata {
  name: string;
  nameCn: string | null;
  nsfw: number;
}

interface UnmatchedAccumulator {
  path: string;
  reason: string;
  driveIds: Set<string>;
}

let applying = false;

function normalizeKeyPart(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildAnimeKey(year: string, type: string, name: string): string {
  return [year, type, name].map(normalizeKeyPart).join("/");
}

function buildGroupKey(year: string, type: string): string {
  return `${normalizeKeyPart(year)}/${normalizeKeyPart(type)}`;
}

function cleanDirectoryTitle(value: string): string {
  return value
    .replace(TECHNICAL_TAG_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 从番剧目录路径解析 year / type / name / bgmid / title / nsfw。
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
  const title = cleanDirectoryTitle(name.slice(0, suffixIndex));
  if (!title) return null;

  return {
    path: `/${year}/${type}/${name}`,
    year,
    type,
    name,
    bgmid,
    title,
    nsfw: NSFW_TAG_PATTERN.test(name) ? 1 : 0,
  };
}

/**
 * 对比 file_index 中的番剧目录与 anime 表, 生成识别结果。
 * 只使用 enabled=1 且 library_sync=1 的 drive; 不写库。
 */
export async function previewLibrarySync(): Promise<LibrarySyncPreview> {
  const libraryDrives = await listLibraryDrives();
  const libraryDriveIDs = libraryDrives.map((drive) => drive.id);
  const { scanHealthy, blockedReason } = evaluateScanHealth(libraryDrives);

  const indexRows = await listIndexedAnimeDirectories();
  const pathSet = new Set<string>();
  const pathDriveIds = new Map<string, Set<string>>();
  const groupDrives = new Map<string, Set<string>>();
  const directoryKeys = new Set<string>();
  const candidates = new Map<string, AnimeDirectory>();
  const unmatchedMap = new Map<string, UnmatchedAccumulator>();

  function addUnmatched(
    path: string,
    reason: string,
    driveIds: Iterable<string>,
  ): void {
    let entry = unmatchedMap.get(path);
    if (!entry) {
      entry = { path, reason, driveIds: new Set() };
      unmatchedMap.set(path, entry);
    }
    for (const driveId of driveIds) entry.driveIds.add(driveId);
  }

  for (const row of indexRows) {
    pathSet.add(row.path);
    let driveIds = pathDriveIds.get(row.path);
    if (!driveIds) {
      driveIds = new Set<string>();
      pathDriveIds.set(row.path, driveIds);
    }
    driveIds.add(row.driveId);

    const segments = row.path.split("/").filter((segment) => segment.length > 0);
    if (segments.length !== ANIME_DIR_DEPTH) continue;

    const [year, type, name] = segments;
    const group = buildGroupKey(year, type);
    let driveSet = groupDrives.get(group);
    if (!driveSet) {
      driveSet = new Set<string>();
      groupDrives.set(group, driveSet);
    }
    driveSet.add(row.driveId);
    directoryKeys.add(buildAnimeKey(year, type, name));

    const candidate = parseAnimeDirectory(row.path);
    if (candidate) {
      const key = buildAnimeKey(candidate.year, candidate.type, candidate.name);
      if (!candidates.has(key)) candidates.set(key, candidate);
      continue;
    }

    // 只报告看起来像年份目录下的问题目录, 避免根目录其他分类产生噪音
    if (YEAR_PATTERN.test(year)) {
      addUnmatched(
        row.path,
        explainUnmatchedDirectory(name),
        [row.driveId],
      );
    }
  }

  /**
   * 只有所有启用且参与库同步的节点都覆盖到的 年/分类 才适合判定缺失。
   * 测试/归档节点（library_sync=0）不参与覆盖判定。
   */
  const completeGroups = new Set<string>();
  for (const [group, driveSet] of groupDrives) {
    if (libraryDriveIDs.length > 0 && driveSet.size >= libraryDriveIDs.length) {
      completeGroups.add(group);
    }
  }

  const rows = (await db.select(ANIME_TABLE_COLUMNS).from(anime)) as AnimeRowRef[];
  const rowByKey = new Map<string, AnimeRowRef>();
  const rowsByBgmid = new Map<string, AnimeRowRef[]>();

  for (const row of rows) {
    const key = buildAnimeKey(row.year, row.type, row.name);
    const existing = rowByKey.get(key);
    // 同一归一化 key 存在重复行时优先保留有效行
    if (!existing || (existing.deleted === 1 && row.deleted === 0)) {
      rowByKey.set(key, row);
    }
    if (row.bgmid && row.bgmid !== SENTINEL_BGMID) {
      const sameBgmid = rowsByBgmid.get(row.bgmid) ?? [];
      sameBgmid.push(row);
      rowsByBgmid.set(row.bgmid, sameBgmid);
    }
  }

  const subjectsByBgmid = await loadSubjectMetadata(
    [...candidates.values()].map((candidate) => candidate.bgmid),
  );

  const discovered: AnimeDirectory[] = [];
  for (const [key, candidate] of candidates) {
    if (rowByKey.has(key)) continue;

    if (candidate.bgmid !== SENTINEL_BGMID) {
      const sameBgmid = rowsByBgmid.get(candidate.bgmid);
      const conflict = sameBgmid?.find(
        (row) => buildAnimeKey(row.year, row.type, row.name) !== key,
      );
      if (conflict) {
        addUnmatched(
          candidate.path,
          `Bangumi ID ${candidate.bgmid} 已存在于 ${conflict.year}/${conflict.type}/${conflict.name}，疑似改名或重复，请人工确认`,
          pathDriveIds.get(candidate.path) ?? [],
        );
        continue;
      }
    }

    discovered.push(enrichCandidate(candidate, subjectsByBgmid));
  }

  const restorable: AnimeRowRef[] = [];
  const missing: AnimeRowRef[] = [];
  const activeKeys = new Set<string>();
  const missingKeys = new Set<string>();

  for (const row of rows) {
    if (row.deleted === 0) {
      activeKeys.add(buildAnimeKey(row.year, row.type, row.name));
    }
  }

  const restorableKeys = new Set<string>();
  for (const row of rows) {
    const key = buildAnimeKey(row.year, row.type, row.name);
    if (directoryKeys.has(key)) {
      // 同一 key 已有有效行时, 不自动恢复历史重复行
      if (row.deleted === 1 && !activeKeys.has(key) && !restorableKeys.has(key)) {
        restorable.push(row);
        restorableKeys.add(key);
      }
      continue;
    }

    const group = buildGroupKey(row.year, row.type);
    if (
      row.deleted === 0 &&
      completeGroups.has(group) &&
      !missingKeys.has(key)
    ) {
      missing.push(row);
      missingKeys.add(key);
    }
  }

  const unmatched = [...unmatchedMap.values()]
    .map((entry) => ({
      path: entry.path,
      reason: entry.reason,
      driveIds: [...entry.driveIds].sort(),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  discovered.sort((a, b) => a.path.localeCompare(b.path));
  restorable.sort((a, b) => a.id - b.id);
  missing.sort((a, b) => a.id - b.id);

  return {
    discovered,
    restorable,
    missing,
    unmatched,
    directoryCount: pathSet.size,
    // 缺失标记在本阶段固定关闭, 待扫描链路与覆盖判定稳定后再开放
    canMarkMissing: false,
    scanHealthy,
    blockedReason,
    canApply: scanHealthy,
  };
}

/**
 * 执行识别结果: 新建番剧、恢复软删除番剧。
 * 扫描健康检查未通过时拒绝任何写入; 缺失标记固定关闭。
 */
export async function applyLibrarySync(
  options: LibrarySyncApplyOptions = {},
): Promise<LibrarySyncApplyResult> {
  if (options.markMissing === true) {
    throw new LibrarySyncRejectedError(
      "缺失标记暂未开放：需扫描链路与覆盖判定稳定后再启用",
    );
  }

  if (applying) {
    throw new LibrarySyncRejectedError("已有识别任务正在执行");
  }

  applying = true;
  try {
    const preview = await previewLibrarySync();

    if (!preview.canApply) {
      throw new LibrarySyncRejectedError(
        preview.blockedReason ?? "扫描健康检查未通过，暂不允许入库",
      );
    }

    let inserted = 0;
    const pending: Array<typeof anime.$inferInsert> = [];

    const flush = async (): Promise<void> => {
      if (pending.length === 0) return;
      const batch = pending.splice(0, pending.length);
      await db.insert(anime).values(batch);
      inserted += batch.length;
      for (const row of batch) {
        log.info(
          `[番剧识别] 新入库 ${row.year}/${row.type}/${row.name} (bgm${row.bgmid})`,
        );
      }
    };

    for (const directory of preview.discovered) {
      // 再次确认, 避免并发任务在 preview 后插入相同目录
      const existing = await findAnimeRow(directory);
      if (existing) continue;

      pending.push({
        year: directory.year,
        type: directory.type,
        name: directory.name,
        bgmid: directory.bgmid,
        title: directory.title,
        nsfw: directory.nsfw,
        deleted: 0,
      });

      if (pending.length >= INSERT_BATCH_SIZE) await flush();
    }
    await flush();

    let restored = 0;
    for (const row of preview.restorable) {
      await db.update(anime).set({ deleted: 0 }).where(eq(anime.id, row.id));
      restored++;
      log.info(`[番剧识别] 恢复番剧 ${row.name} (laID ${row.id})`);
    }

    const markedMissing = 0;

    if (inserted || restored) {
      log.info(`[番剧识别] 完成: 新增 ${inserted}, 恢复 ${restored}`);
    } else {
      log.info("[番剧识别] 完成: 无变更");
    }

    return { inserted, restored, markedMissing, preview };
  } finally {
    applying = false;
  }
}

function evaluateScanHealth(drives: LibraryDriveHealthRow[]): {
  scanHealthy: boolean;
  blockedReason: string | null;
} {
  if (drives.length === 0) {
    return {
      scanHealthy: false,
      blockedReason: "没有启用且参与番剧库同步的存储节点",
    };
  }

  const reasons: string[] = [];
  for (const drive of drives) {
    if (drive.lastScanOk === 0) {
      reasons.push(`节点 ${drive.id} 最近一次扫描失败`);
      continue;
    }
    if (drive.lastScanOk !== 1 || !drive.lastScanAt) {
      reasons.push(`节点 ${drive.id} 尚未完成扫描`);
      continue;
    }
    if (Date.now() - drive.lastScanAt.getTime() > SCAN_FRESH_MS) {
      reasons.push(`节点 ${drive.id} 的索引超过 24 小时未更新`);
    }
    if (drive.lastScanRows === null || drive.lastScanRows < 0) {
      reasons.push(`节点 ${drive.id} 的索引条目数无效`);
    }
  }

  return reasons.length === 0
    ? { scanHealthy: true, blockedReason: null }
    : { scanHealthy: false, blockedReason: reasons.join("；") };
}

function enrichCandidate(
  candidate: AnimeDirectory,
  subjectsByBgmid: Map<string, SubjectMetadata>,
): AnimeDirectory {
  if (candidate.bgmid === SENTINEL_BGMID) return candidate;

  const subject = subjectsByBgmid.get(candidate.bgmid);
  const title =
    subject?.nameCn?.trim() || subject?.name?.trim() || candidate.title;
  const nsfw =
    candidate.nsfw === 1 || subject?.nsfw === 1 ? 1 : 0;

  return { ...candidate, title, nsfw };
}

async function loadSubjectMetadata(
  bgmids: string[],
): Promise<Map<string, SubjectMetadata>> {
  const numericBgmids = [
    ...new Set(
      bgmids
        .filter((bgmid) => bgmid !== SENTINEL_BGMID)
        .map((bgmid) => Number(bgmid))
        .filter((bgmid) => Number.isSafeInteger(bgmid) && bgmid > 0),
    ),
  ];

  if (numericBgmids.length === 0) return new Map();

  const rows = await db
    .select({
      bgmid: subjects.bgmid,
      name: subjects.name,
      nameCn: subjects.name_cn,
      nsfw: subjects.nsfw,
    })
    .from(subjects)
    .where(inArray(subjects.bgmid, numericBgmids));

  return new Map(
    rows.map((row) => [
      String(row.bgmid),
      { name: row.name, nameCn: row.nameCn, nsfw: row.nsfw },
    ]),
  );
}

async function listLibraryDrives(): Promise<LibraryDriveHealthRow[]> {
  return db
    .select({
      id: drives.id,
      lastScanAt: drives.lastScanAt,
      lastScanOk: drives.lastScanOk,
      lastScanRows: drives.lastScanRows,
    })
    .from(drives)
    .where(and(eq(drives.enabled, 1), eq(drives.librarySync, 1)));
}

async function listIndexedAnimeDirectories(): Promise<
  Array<{ driveId: string; path: string }>
> {
  const rows = await db
    .select({ driveId: fileIndex.driveId, path: fileIndex.path })
    .from(fileIndex)
    .innerJoin(drives, eq(fileIndex.driveId, drives.id))
    .where(
      and(
        eq(fileIndex.type, "dir"),
        eq(fileIndex.deleted, 0),
        eq(drives.enabled, 1),
        eq(drives.librarySync, 1),
        sql`CHAR_LENGTH(${fileIndex.path}) - CHAR_LENGTH(REPLACE(${fileIndex.path}, '/', '')) = ${ANIME_DIR_DEPTH}`,
      ),
    );

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.driveId}\u0000${row.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function findAnimeRow(
  directory: AnimeDirectory,
): Promise<AnimeRowRef | null> {
  const rows = (await db
    .select(ANIME_TABLE_COLUMNS)
    .from(anime)
    .where(eq(anime.year, directory.year))) as AnimeRowRef[];

  const key = buildAnimeKey(directory.year, directory.type, directory.name);
  return (
    rows.find(
      (row) => buildAnimeKey(row.year, row.type, row.name) === key,
    ) ?? null
  );
}

function explainUnmatchedDirectory(name: string): string {
  if (!BGMID_SUFFIX_PATTERN.test(name)) {
    return "目录名未以 Bangumi ID 数字结尾";
  }
  return "目录名缺少可用的标题部分";
}
