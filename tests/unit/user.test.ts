import { describe, it, expect, beforeAll } from "vitest";
import { getFormattedPassword } from "../../services/v2/user/password.js";
import {
  findUser,
  findUserByID,
  checkEmailExists,
  checkNameExists,
  createUser,
} from "../../services/v2/user/user.js";

const testEmail = `test_${Date.now()}@example.com`;
const testName = `tester_${Date.now()}`;

describe("createUser", () => {
  it("应创建新用户并返回 true", async () => {
    const hash = getFormattedPassword("test_pass");
    const result = await createUser(testEmail, hash, testName);
    expect(result).toBe(true);
  });
});

describe("findUser", () => {
  it("应通过用户名找到用户", async () => {
    const user = await findUser(testName);
    expect(user).not.toBe(false);
    expect(user.name).toBe(testName);
    expect(user.data).toBeDefined();
    expect(user.password).toBeDefined();
  });

  it("应通过邮箱找到用户", async () => {
    const user = await findUser(testEmail);
    expect(user).not.toBe(false);
    expect(user.email).toBe(testEmail);
  });

  it("不存在的账号应返回 false", async () => {
    expect(await findUser("nonexistent_user_12345")).toBe(false);
  });
});

describe("findUserByID", () => {
  it("已创建的用户应可通过 ID 找到", async () => {
    const user = await findUser(testName);
    const byID = await findUserByID(user.id);
    expect(byID).not.toBe(false);
    expect(byID.name).toBe(testName);
  });

  it("不存在的 ID 应返回 false", async () => {
    expect(await findUserByID(99999)).toBe(false);
  });

  it("空值应返回 false", async () => {
    expect(await findUserByID(null)).toBe(false);
    expect(await findUserByID(undefined)).toBe(false);
  });
});

describe("checkEmailExists", () => {
  it("已注册的邮箱应返回 true", async () => {
    expect(await checkEmailExists(testEmail)).toBe(true);
  });

  it("未注册的邮箱应返回 false", async () => {
    expect(await checkEmailExists("nonexistent@test.com")).toBe(false);
  });
});

describe("checkNameExists", () => {
  it("已注册的用户名应返回 true", async () => {
    expect(await checkNameExists(testName)).toBe(true);
  });

  it("未注册的用户名应返回 false", async () => {
    expect(await checkNameExists("nonexistent_user_xyz")).toBe(false);
  });
});
