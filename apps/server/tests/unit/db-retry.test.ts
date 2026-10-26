import { describe, it, expect, vi } from "vitest";

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
  isDeadlockError,
  withDeadlockRetry,
} from "../../common/database/retry.js";

function deadlockError(): Error {
  return Object.assign(
    new Error("Deadlock found when trying to get lock; try restarting transaction"),
    { errno: 1213, code: "ER_LOCK_DEADLOCK" },
  );
}

const retryOptions = {
  attempts: 5,
  baseDelayMs: 1,
  sleep: vi.fn(async () => {}),
  random: () => 0.5,
};

describe("isDeadlockError", () => {
  it("应识别 errno 1213 / ER_LOCK_DEADLOCK", () => {
    expect(isDeadlockError(deadlockError())).toBe(true);
    expect(isDeadlockError({ errno: 1213 })).toBe(true);
    expect(isDeadlockError({ code: "ER_LOCK_DEADLOCK" })).toBe(true);
  });

  it("应沿 DrizzleQueryError 的 cause 链识别", () => {
    const wrapped = new Error("Failed query: update file_index", {
      cause: deadlockError(),
    });
    expect(isDeadlockError(wrapped)).toBe(true);
  });

  it("不应把普通错误误判为死锁", () => {
    expect(isDeadlockError(new Error("permission denied"))).toBe(false);
    expect(isDeadlockError({ errno: 1205 })).toBe(false);
    expect(isDeadlockError(null)).toBe(false);
  });
});

describe("withDeadlockRetry", () => {
  it("首次写入抛 1213 后应重试成功", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(deadlockError())
      .mockResolvedValueOnce("ok");

    await expect(withDeadlockRetry(operation, retryOptions)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("Drizzle 包装后的死锁也应重试", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Failed query", { cause: deadlockError() }),
      )
      .mockResolvedValueOnce(42);

    await expect(withDeadlockRetry(operation, retryOptions)).resolves.toBe(42);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("非死锁错误不应重试", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("permission denied"));

    await expect(withDeadlockRetry(operation, retryOptions)).rejects.toThrow(
      "permission denied",
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("持续死锁时应在 attempts 次后抛错", async () => {
    const operation = vi.fn().mockRejectedValue(deadlockError());

    await expect(
      withDeadlockRetry(operation, { ...retryOptions, attempts: 3 }),
    ).rejects.toMatchObject({ errno: 1213 });
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
