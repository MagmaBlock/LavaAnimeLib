import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { doAll } from "../../tasks/v2/main.js";
import type { MainTaskDeps } from "../../tasks/v2/main.js";
import type { ScanReport } from "../../tasks/v2/scan.js";
import type { LibrarySyncApplyResult } from "../../services/v2/anime/library-sync.js";
import { log } from "../../common/tools/logger.js";

function drive(
  values: Pick<ScanReport["drives"][number], "driveId" | "ok"> &
    Partial<ScanReport["drives"][number]>,
): ScanReport["drives"][number] {
  return {
    rows: 0,
    librarySync: true,
    finishedAt: new Date(),
    ...values,
  };
}

function report(
  ok: boolean,
  drives: ScanReport["drives"] = [],
  libraryOk = ok,
): ScanReport {
  return { ok, libraryOk, drives };
}

function syncResult(): LibrarySyncApplyResult {
  return {
    inserted: 0,
    restored: 0,
    markedMissing: 0,
    preview: {
      discovered: [],
      restorable: [],
      missing: [],
      unmatched: [],
      directoryCount: 0,
      canMarkMissing: false,
      scanHealthy: true,
      blockedReason: null,
      canApply: true,
    },
  };
}

function deps(
  scan: MainTaskDeps["scan"],
  applySync: MainTaskDeps["applySync"] = vi.fn(async () => syncResult()),
): MainTaskDeps {
  return { scan, applySync };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("doAll", () => {
  it("扫描全部成功时执行番剧识别并返回 0", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(
      deps(
        async () =>
          report(true, [
            drive({ driveId: "gd_uni", ok: true, rows: 120 }),
          ]),
        applySync,
      ),
    );

    expect(exitCode).toBe(0);
    expect(applySync).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenCalledWith(
      expect.stringContaining("所有扫描任务已经完成"),
    );
  });

  it("库节点扫描失败时跳过番剧识别、记录失败 drive 并返回 1", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(
      deps(
        async () =>
          report(false, [
            drive({ driveId: "gd_uni", ok: false, librarySync: true, error: "deadlock" }),
            drive({ driveId: "r2-test", ok: true, librarySync: false, rows: 10 }),
          ]),
        applySync,
      ),
    );

    expect(exitCode).toBe(1);
    expect(applySync).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining("gd_uni: deadlock"),
    );
    expect(log.info).not.toHaveBeenCalledWith(
      expect.stringContaining("所有扫描任务已经完成"),
    );
  });

  it("非库节点失败但库节点成功时仍执行番剧识别并返回 0", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(
      deps(
        async () =>
          report(
            false,
            [
              drive({ driveId: "gd_uni", ok: true, rows: 120, librarySync: true }),
              drive({
                driveId: "r2-test",
                ok: false,
                rows: 0,
                librarySync: false,
                error: "auth failed",
              }),
            ],
            true,
          ),
        applySync,
      ),
    );

    expect(exitCode).toBe(0);
    expect(applySync).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringContaining("r2-test: auth failed"),
    );
    expect(log.info).toHaveBeenCalledWith(
      expect.stringContaining("番剧库扫描已完成"),
    );
    expect(log.info).not.toHaveBeenCalledWith(
      expect.stringContaining("所有扫描任务已经完成"),
    );
  });

  it("没有库节点时跳过番剧识别并返回 1", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(
      deps(
        async () =>
          report(
            true,
            [drive({ driveId: "r2-test", ok: true, librarySync: false })],
            false,
          ),
        applySync,
      ),
    );

    expect(exitCode).toBe(1);
    expect(applySync).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining("没有参与番剧识别的存储节点"),
    );
  });

  it("scanAllDrives 抛错时不执行识别并返回 1", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(
      deps(async () => {
        throw new Error("db down");
      }, applySync),
    );

    expect(exitCode).toBe(1);
    expect(applySync).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalled();
  });

  it("无启用 drive 的报告应视为失败", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(deps(async () => report(false), applySync));

    expect(exitCode).toBe(1);
    expect(applySync).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining("没有参与番剧识别的存储节点"),
    );
  });

  it("番剧识别失败时返回 1", async () => {
    const exitCode = await doAll(
      deps(
        async () =>
          report(true, [
            drive({ driveId: "gd_uni", ok: true, rows: 1 }),
          ]),
        async () => {
          throw new Error("library sync failed");
        },
      ),
    );

    expect(exitCode).toBe(1);
    expect(log.error).toHaveBeenCalled();
  });
});
