import { describe, it, expect, beforeAll } from "vitest";
import { getFormattedPassword } from "../../services/v2/user/password.js";
import { createUser, findUser } from "../../services/v2/user/user.js";
import cache from "../../common/cache.js";
import {
  updateUserData,
  changeUserPassword,
  updateUserSettings,
} from "../../services/v2/user/profile.js";
import { db } from "../../common/database/connection.js";
import { user } from "../../common/database/schema/user.js";
import { eq } from "drizzle-orm";

let userID: number;
const TS = Date.now();

beforeAll(async () => {
  const hash = getFormattedPassword("test_prof");
  await createUser(
    `profile_${TS}@t.com`,
    hash,
    `profile_${TS}`
  );
  const foundUser = await findUser(`profile_${TS}`);
  userID = foundUser.id;
});

describe("updateUserData", () => {
  it("应更新用户 data 字段", async () => {
    const data = { avatar: "https://example.com/avatar.png", bio: "test" };
    await updateUserData(data, userID);
    const rows = await db
      .select({ data: user.data })
      .from(user)
      .where(eq(user.id, userID));
    expect(JSON.parse(rows[0].data)).toEqual(data);
  });

  it("更新后应清除缓存", async () => {
    cache.user[userID] = { cached: true };
    await updateUserData({ key: "val" }, userID);
    expect(cache.user[userID]).toBeUndefined();
  });

  it("缺少参数应抛错", async () => {
    await expect(updateUserData(null as any, 1)).rejects.toBeDefined();
    await expect(updateUserData({}, null as any)).rejects.toBeDefined();
  });
});

describe("changeUserPassword", () => {
  it("应更新密码字段", async () => {
    const newHash = getFormattedPassword("new_password_456");
    await changeUserPassword(userID, newHash);
    const rows = await db
      .select({ password: user.password })
      .from(user)
      .where(eq(user.id, userID));
    expect(rows[0].password).toBe(newHash);
  });

  it("更新后应清除缓存", async () => {
    cache.user[userID] = { cached: true };
    await changeUserPassword(userID, "some_hash");
    expect(cache.user[userID]).toBeUndefined();
  });

  it("缺少参数应抛错", async () => {
    await expect(changeUserPassword(null as any, "hash")).rejects.toBeDefined();
    await expect(changeUserPassword(1, null as any)).rejects.toBeDefined();
  });
});

describe("updateUserSettings", () => {
  it("应更新用户 settings 字段", async () => {
    const settings = { theme: "dark", lang: "zh" };
    await updateUserSettings(settings, userID);
    const rows = await db
      .select({ settings: user.settings })
      .from(user)
      .where(eq(user.id, userID));
    expect(JSON.parse(rows[0].settings)).toEqual(settings);
  });

  it("更新后应清除缓存", async () => {
    cache.user[userID] = { cached: true };
    await updateUserSettings({ key: "val" }, userID);
    expect(cache.user[userID]).toBeUndefined();
  });

  it("缺少参数应抛错", async () => {
    await expect(updateUserSettings(null as any, 1)).rejects.toBeDefined();
    await expect(updateUserSettings({}, null as any)).rejects.toBeDefined();
  });
});
