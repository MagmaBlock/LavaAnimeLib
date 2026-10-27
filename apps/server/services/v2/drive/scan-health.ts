import { eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { drives } from "../../../common/database/schema/drive.js";
import { withDeadlockRetry } from "../../../common/database/retry.js";

export const MAX_SCAN_ERROR_LENGTH = 2000;

/** drive.config 中可能包含凭据的字段名 */
const SECRET_KEY_PATTERN = /pass(word)?|token|secret|api[-_]?key|auth|cookie|credential/i;

function collectSecretValues(value: unknown, secrets: Set<string>): void {
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === "string") {
      if (child.length > 0 && SECRET_KEY_PATTERN.test(key)) secrets.add(child);
      continue;
    }
    if (child && typeof child === "object") collectSecretValues(child, secrets);
  }
}

/**
 * 生成可落库的扫描错误文本：剥离 drive.config 中的凭据并截断到 2000 字符。
 * 只保存 message，不序列化 axios/driver 的完整请求配置。
 */
export function sanitizeScanError(error: unknown, config?: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  const secrets = new Set<string>();
  collectSecretValues(config, secrets);

  let sanitized = message;
  for (const secret of secrets) {
    sanitized = sanitized.split(secret).join("***");
  }

  if (sanitized.length <= MAX_SCAN_ERROR_LENGTH) return sanitized;
  return `${sanitized.slice(0, MAX_SCAN_ERROR_LENGTH - 3)}...`;
}

export interface DriveScanHealth {
  ok: boolean;
  rows: number;
  error?: string | null;
  scannedAt?: Date;
}

export async function updateDriveScanHealth(
  driveId: string,
  health: DriveScanHealth,
): Promise<void> {
  const error =
    health.error && health.error.length > 0
      ? health.error.slice(0, MAX_SCAN_ERROR_LENGTH)
      : null;

  await withDeadlockRetry(
    () =>
      db
        .update(drives)
        .set({
          lastScanAt: health.scannedAt ?? new Date(),
          lastScanOk: health.ok ? 1 : 0,
          lastScanRows: health.rows,
          lastScanError: error,
        })
        .where(eq(drives.id, driveId)),
    { label: `drives.health:${driveId}` },
  );
}
