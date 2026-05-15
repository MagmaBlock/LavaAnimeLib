import { describe, it, expect } from "vitest";
import {
  testPassword,
  isSecurePassword,
  getFormattedPassword,
} from "../../services/v2/user/password.js";

describe("isSecurePassword", () => {
  it("应接受 7-64 位含字母的密码", () => {
    expect(isSecurePassword("abc1234")).toBe(true);
    expect(isSecurePassword("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2")).toBe(true);
    expect(isSecurePassword("Password!@#")).toBe(true);
  });

  it("应拒绝不含字母的密码", () => {
    expect(isSecurePassword("1234567")).toBe(false);
    expect(isSecurePassword("!@#$%^&")).toBe(false);
  });

  it("应拒绝长度不足 7 位的密码", () => {
    expect(isSecurePassword("ab1")).toBe(false);
    expect(isSecurePassword("abc12")).toBe(false);
    expect(isSecurePassword("a1b2c3")).toBe(false);
  });

  it("应拒绝长度超过 64 位的密码", () => {
    expect(isSecurePassword("a" + "1".repeat(64))).toBe(false);
  });

  it("应拒绝空字符串", () => {
    expect(isSecurePassword("")).toBe(false);
  });
});

describe("getFormattedPassword", () => {
  it("应返回 sha256:salt:hash 格式", () => {
    const result = getFormattedPassword("test123");
    expect(result).toMatch(/^sha256:[a-f0-9]{16}:[a-f0-9]{64}$/);
  });

  it("相同密码每次应生成不同的 hash（随机盐）", () => {
    const hash1 = getFormattedPassword("samepass");
    const hash2 = getFormattedPassword("samepass");
    expect(hash1).not.toBe(hash2);
  });
});

describe("testPassword", () => {
  it("正确密码应验证通过", () => {
    const hash = getFormattedPassword("my_password");
    expect(testPassword("my_password", hash)).toBe(true);
  });

  it("错误密码应验证失败", () => {
    const hash = getFormattedPassword("real_password");
    expect(testPassword("wrong_password", hash)).toBe(false);
  });

  it("非 sha256 格式应返回 false", () => {
    expect(testPassword("any", "md5:salt:hash")).toBe(false);
    expect(testPassword("any", "invalid_format")).toBe(false);
  });
});
