import { describe, it, expect, vi } from "vitest";

vi.mock("../../common/tools/logger.js", () => ({
  log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
  MAX_SCAN_ERROR_LENGTH,
  sanitizeScanError,
} from "../../services/v2/drive/scan-health.js";

describe("sanitizeScanError", () => {
  it("应剥离 drive.config 中的凭据", () => {
    const error = new Error(
      "connect failed: password=hunter2 token=tok_abc123 host=https://alist.example.com",
    );

    const text = sanitizeScanError(error, {
      host: "https://alist.example.com",
      path: "/library",
      password: "hunter2",
      token: "tok_abc123",
    });

    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("tok_abc123");
    expect(text).toContain("***");
    expect(text).toContain("https://alist.example.com");
  });

  it("应截断超长错误", () => {
    const text = sanitizeScanError(new Error("x".repeat(MAX_SCAN_ERROR_LENGTH + 100)));

    expect(text).toHaveLength(MAX_SCAN_ERROR_LENGTH);
    expect(text.endsWith("...")).toBe(true);
  });
});
