import { pool } from "../../common/database/connection.js";
import { log } from "../../common/tools/logger.js";
import scanAllDrives from "./scan.js";
import { applyLibrarySync } from "../../services/v2/anime/library-sync.js";

doAll();
async function doAll() {
  log.info("开始全量扫描文件系统索引...");
  await scanAllDrives();

  log.info("开始识别新入盘番剧...");
  try {
    const result = await applyLibrarySync();
    log.info(
      `番剧识别完成: 新增 ${result.inserted}, 恢复 ${result.restored}, 标记删除 ${result.markedMissing}`
    );
    if (result.preview.missing.length > 0) {
      log.warn(
        `发现 ${result.preview.missing.length} 部库内番剧在文件索引中缺失, 未自动标记删除。可在后台预览后手动处理。`
      );
    }
    if (result.preview.unmatched.length > 0) {
      log.warn(
        `发现 ${result.preview.unmatched.length} 个无法自动识别的目录: ${result.preview.unmatched
          .map((item) => item.path)
          .join(", ")}`
      );
    }
  } catch (error) {
    log.error(error, "番剧识别失败");
  }

  log.info("所有扫描任务已经完成! 将在 10 秒后关闭...");
  setTimeout(() => {
    pool.end();
  }, 10000);
}
