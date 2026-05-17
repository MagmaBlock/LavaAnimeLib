import { describe, it, expect } from "vitest";
import { generateInviteCode } from "../../services/v2/user/invite-code.js";

describe("generateInviteCode", () => {
  it("应返回 12 位长度的字符串", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(12);
  });

  it("应只包含字母和数字", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("每次调用应返回不同结果", () => {
    const code1 = generateInviteCode();
    const code2 = generateInviteCode();
    expect(code1).not.toBe(code2);
  });
});
