import { describe, it, expect } from "vitest";
import {
  getAllValidCodes,
  deleteInviteCode,
} from "../../services/v2/admin/invite.js";
import { generateInviteCode, saveInviteCode } from "../../services/v2/user/invite-code.js";

describe("getAllValidCodes", () => {
  it("应返回有效邀请码列表", async () => {
    const result = await getAllValidCodes();
    expect(Array.isArray(result)).toBe(true);
    for (const code of result) {
      expect(code.code).toBeDefined();
      expect(typeof code.code).toBe("string");
    }
  });
});

describe("deleteInviteCode", () => {
  it("删除已存在的邀请码", async () => {
    const code = generateInviteCode();
    await saveInviteCode(code, 1, null);
    const result = await deleteInviteCode(code);
    expect(result).toBeDefined();
  });

  it("非字符串参数应抛错", async () => {
    await expect(deleteInviteCode(123 as any)).rejects.toBeDefined();
    await expect(deleteInviteCode(null as any)).rejects.toBeDefined();
    await expect(deleteInviteCode(undefined as any)).rejects.toBeDefined();
  });
});
