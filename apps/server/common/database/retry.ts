import { setTimeout as delay } from "node:timers/promises";
import { log } from "../tools/logger.js";

const DEADLOCK_ERRNO = 1213;
const DEADLOCK_CODE = "ER_LOCK_DEADLOCK";
const DEFAULT_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 50;
const DEFAULT_MAX_DELAY_MS = 2000;

export interface DeadlockRetryOptions {
  /** 总尝试次数（含首次），默认 5 */
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** 写入批次/操作的日志标签 */
  label?: string;
  /** 测试注入点 */
  sleep?: (ms: number) => Promise<void>;
  /** 测试注入点，返回 [0, 1) */
  random?: () => number;
}

/**
 * 识别 MySQL 死锁。Drizzle 会把驱动错误包在 DrizzleQueryError.cause 里，
 * 因此沿 cause 链检查 errno / code。
 */
export function isDeadlockError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);

    const candidate = current as {
      errno?: unknown;
      code?: unknown;
      message?: unknown;
      cause?: unknown;
    };

    if (candidate.errno === DEADLOCK_ERRNO || candidate.code === DEADLOCK_CODE) {
      return true;
    }
    if (
      typeof candidate.message === "string" &&
      candidate.message.includes("Deadlock found when trying to get lock")
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}

/**
 * 对 MySQL ER_LOCK_DEADLOCK (1213) 做有界指数退避重试；其他错误立即抛出。
 * 延迟使用 full jitter，避免多写入方同时重试再次死锁。
 */
export async function withDeadlockRetry<T>(
  operation: () => Promise<T>,
  options: DeadlockRetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS);
  const sleep = options.sleep ?? delay;
  const random = options.random ?? Math.random;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isDeadlockError(error) || attempt === attempts) {
        throw error;
      }

      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delay = Math.floor(random() * backoff);
      log.warn(
        `死锁重试 (${attempt}/${attempts - 1})${options.label ? ` [${options.label}]` : ""}: ${delay}ms 后重试`,
      );
      if (delay > 0) await sleep(delay);
    }
  }

  // 循环必然 return 或 throw，这里仅用于类型收敛
  throw new Error("withDeadlockRetry: unreachable");
}
