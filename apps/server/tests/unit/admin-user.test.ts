import { describe, it, expect, beforeAll } from "vitest";
import { getFormattedPassword } from "../../services/v2/user/password.js";
import { createUser } from "../../services/v2/user/user.js";
import { listUsers } from "../../services/v2/user/admin.js";
import { changeUserPassword } from "../../services/v2/user/profile.js";
import { db } from "../../common/database/connection.js";
import { user } from "../../common/database/schema/user.js";
import { eq } from "drizzle-orm";
import { listUsersQuerySchema } from "../../schemas/v2/user/list.js";
import { adminChangePasswordBodySchema } from "../../schemas/v2/user/admin-change-password.js";

const TS = Date.now();

describe("listUsers", () => {
  beforeAll(async () => {
    for (let i = 0; i < 5; i++) {
      const hash = getFormattedPassword("test123");
      await createUser(`admin_lu_${TS}_${i}@t.com`, hash, `admin_lu_${TS}_${i}`);
    }
  });

  it("应返回分页用户列表", async () => {
    const { list, total } = await listUsers(0, 10);
    expect(Array.isArray(list)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(5);
    for (const u of list) {
      expect(u.id).toBeDefined();
      expect(u.name).toBeDefined();
      expect(u.email).toBeDefined();
    }
  });

  it("limit 应限制返回数量", async () => {
    const { list } = await listUsers(0, 2);
    expect(list.length).toBeLessThanOrEqual(2);
  });

  it("offset 应正确跳过记录", async () => {
    const { list: page1 } = await listUsers(0, 2);
    const { list: page2 } = await listUsers(2, 2);
    if (page1.length === 2 && page2.length > 0) {
      expect(page1[0].id).not.toBe(page2[0].id);
    }
  });

  it("limit 为 0 时应返回空列表", async () => {
    const { list } = await listUsers(0, 0);
    expect(list.length).toBe(0);
  });

  it("total 应为全部用户数（不小于创建数）", async () => {
    const { list, total } = await listUsers(0, 5);
    expect(list.length).toBeLessThanOrEqual(5);
    expect(total).toBeGreaterThanOrEqual(5);
  });
});

describe("changeUserPassword (admin scenario)", () => {
  let testUserID: number;

  beforeAll(async () => {
    const hash = getFormattedPassword("initial_pw");
    await createUser(`admin_cp_${TS}@t.com`, hash, `admin_cp_${TS}`);
    const rows = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, `admin_cp_${TS}@t.com`));
    testUserID = rows[0]!.id;
  });

  it("密码修改后应反映在数据库中", async () => {
    const newHash = getFormattedPassword("new_admin_pw");
    await changeUserPassword(testUserID, newHash);

    const updated = await db
      .select({ password: user.password })
      .from(user)
      .where(eq(user.id, testUserID));
    expect(updated[0]!.password).toBe(newHash);
  });

  it("不存在的用户ID 调用 changeUserPassword 不应抛错", async () => {
    await expect(
      changeUserPassword(99999999, getFormattedPassword("nobody"))
    ).resolves.toBeUndefined();
  });
});

describe("listUsersQuerySchema", () => {
  it("默认值应生效", () => {
    const result = listUsersQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("合法参数应通过（字符串 coerce）", () => {
    const result = listUsersQuerySchema.safeParse({ page: "3", pageSize: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it("page 小于 1 应拒绝", () => {
    const result = listUsersQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("pageSize 超过 100 应拒绝", () => {
    const result = listUsersQuerySchema.safeParse({ pageSize: 101 });
    expect(result.success).toBe(false);
  });

  it("非法字符串应拒绝", () => {
    const result = listUsersQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("adminChangePasswordBodySchema", () => {
  it("合法参数应通过", () => {
    const result = adminChangePasswordBodySchema.safeParse({
      userID: 1,
      password: "abcdefg",
    });
    expect(result.success).toBe(true);
  });

  it("缺少 userID 应拒绝", () => {
    const result = adminChangePasswordBodySchema.safeParse({ password: "abcdefg" });
    expect(result.success).toBe(false);
  });

  it("缺少 password 应拒绝", () => {
    const result = adminChangePasswordBodySchema.safeParse({ userID: 1 });
    expect(result.success).toBe(false);
  });

  it("密码纯数字应拒绝", () => {
    const result = adminChangePasswordBodySchema.safeParse({
      userID: 1,
      password: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("密码过短应拒绝", () => {
    const result = adminChangePasswordBodySchema.safeParse({
      userID: 1,
      password: "a",
    });
    expect(result.success).toBe(false);
  });

  it("密码过长应拒绝", () => {
    const result = adminChangePasswordBodySchema.safeParse({
      userID: 1,
      password: "a".repeat(65),
    });
    expect(result.success).toBe(false);
  });

  it("userID 为 0 应拒绝", () => {
    const result = adminChangePasswordBodySchema.safeParse({
      userID: 0,
      password: "abcdefgh",
    });
    expect(result.success).toBe(false);
  });

  it("密码 7 位含字母应通过", () => {
    const result = adminChangePasswordBodySchema.safeParse({
      userID: 1,
      password: "abc1234",
    });
    expect(result.success).toBe(true);
  });
});
