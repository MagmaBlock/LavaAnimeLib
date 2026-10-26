import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { doAll } from "../../tasks/v2/main.js";
import type { MainTaskDeps } from "../../tasks/v2/main.js";
import type { ScanReport } from "../../tasks/v2/scan.js";
import type { LibrarySyncApplyResult } from "../../services/v2/anime/library-sync.js";
import { log } from "../../common/tools/logger.js";

function report(ok: boolean, drives: ScanReport["drives"] = []): ScanReport {
  return { ok, drives };
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
            { driveId: "gd_uni", ok: true, rows: 120, finishedAt: new Date() },
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

  it("扫描失败时跳过番剧识别、记录失败 drive 并返回 1", async () => {
    const applySync = vi.fn(async () => syncResult());
    const exitCode = await doAll(
      deps(
        async () =>
          report(false, [
            { driveId: "gd_uni", ok: false, rows: 0, finishedAt: new Date(), error: "deadlock" },
            { driveId: "r2-test", ok: true, rows: 10, finishedAt: new Date() },
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
  });

  it("番剧识别失败时返回 1", async () => {
    const exitCode = await doAll(
      deps(
        async () =>
          report(true, [
            { driveId: "gd_uni", ok: true, rows: 1, finishedAt: new Date() },
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
