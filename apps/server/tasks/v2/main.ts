import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pool } from "../../common/database/connection.js";
import { log } from "../../common/tools/logger.js";
import scanAllDrives from "./scan.js";
import type { ScanReport } from "./scan.js";
import { applyLibrarySync } from "../../services/v2/anime/library-sync.js";
import type { LibrarySyncApplyResult } from "../../services/v2/anime/library-sync.js";

export interface MainTaskDeps {
  scan: () => Promise<ScanReport>;
  applySync: () => Promise<LibrarySyncApplyResult>;
}

export async function doAll(
  deps: MainTaskDeps = { scan: scanAllDrives, applySync: applyLibrarySync },
): Promise<number> {
  log.info("开始全量扫描文件系统索引...");

  let report: ScanReport;
  try {
    report = await deps.scan();
  } catch (error) {
    log.error(error, "全量扫描异常终止");
    return 1;
  }

  if (!report.ok) {
    const failed = report.drives.filter((drive) => !drive.ok);
    const detail = failed
      .map((drive) => `${drive.driveId}: ${drive.error ?? "未知错误"}`)
      .join("; ");
    log.error(
      `扫描未完全成功 (${failed.length}/${report.drives.length} 个存储节点失败): ${detail || "没有启用的存储节点"}`,
    );
    log.error("已跳过番剧识别, 请修复扫描错误后重新执行");
    return 1;
  }

  const totalRows = report.drives.reduce((sum, drive) => sum + drive.rows, 0);
  log.info(
    `所有扫描任务已经完成: ${report.drives.length} 个存储节点, ${totalRows} 条索引`,
  );

  log.info("开始识别新入盘番剧...");
  try {
    const result = await deps.applySync();
    log.info(
      `番剧识别完成: 新增 ${result.inserted}, 恢复 ${result.restored}`,
    );
    if (result.preview.missing.length > 0) {
      log.warn(
        `发现 ${result.preview.missing.length} 部库内番剧在文件索引中未见（仅诊断，未删除；缺失标记暂未开放）。`,
      );
    }
    if (result.preview.unmatched.length > 0) {
      log.warn(
        `发现 ${result.preview.unmatched.length} 个无法自动识别的目录: ${result.preview.unmatched
          .map((item) => item.path)
          .join(", ")}`,
      );
    }
  } catch (error) {
    log.error(error, "番剧识别失败");
    return 1;
  }

  return 0;
}

async function runMain(): Promise<void> {
  let exitCode = 1;
  try {
    exitCode = await doAll();
  } catch (error) {
    log.error(error, "同步任务异常终止");
  } finally {
    process.exitCode = exitCode;
    log.info(
      exitCode === 0
        ? "同步任务完成, 将在 10 秒后关闭..."
        : "同步任务失败, 将在 10 秒后关闭...",
    );
    setTimeout(() => {
      void pool.end();
    }, 10000);
  }
}

const entryPath = process.argv[1];
const isDirectRun = (() => {
  if (!entryPath) return false;
  try {
    return (
      realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entryPath)
    );
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  void runMain();
}
