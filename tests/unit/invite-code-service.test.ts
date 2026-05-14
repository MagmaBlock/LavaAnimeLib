import { describe, it, expect, beforeAll } from "vitest";
import { getFormattedPassword } from "../../services/v2/user/password.js";
import { createUser, findUser } from "../../services/v2/user/user.js";
import {
  generateInviteCode,
  saveInviteCode,
  testInviteCode,
  useInviteCode,
  getUserInviteCodes,
} from "../../services/v2/user/invite-code.js";

let userID: number;
const TS = Date.now();

beforeAll(async () => {
  const hash = getFormattedPassword("test_ic");
  await createUser(
    `ic_full_${TS}@t.com`,
    hash,
    `ic_full_${TS}`
  );
  const user = await findUser(`ic_full_${TS}`);
  userID = user.id;
});

describe("saveInviteCode + testInviteCode", () => {
  it("保存后应可通过 testInviteCode 查询到", async () => {
    const code = generateInviteCode();
    await saveInviteCode(code, userID, null);
    const result = await testInviteCode(code);
    expect(result.real).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.used).toBe(false);
  });

  it("不存在的邀请码应返回 real=false", async () => {
    const result = await testInviteCode("NONEXISTENT123");
    expect(result.real).toBe(false);
    expect(result.expired).toBeNull();
    expect(result.used).toBeNull();
  });

  it("无参数应抛错", async () => {
    await expect(saveInviteCode("", 1, null)).rejects.toBeDefined();
    await expect(testInviteCode("")).rejects.toBeDefined();
  });
});

describe("useInviteCode", () => {
  it("使用邀请码后应标记为已用", async () => {
    const code = generateInviteCode();
    await saveInviteCode(code, userID, null);
    const result = await useInviteCode(code, userID);
    expect(result).toBe(true);

    const check = await testInviteCode(code);
    expect(check.used).toBe(true);
  });

  it("无参数应抛错", async () => {
    await expect(useInviteCode("", userID)).rejects.toBeDefined();
    await expect(useInviteCode("SOMECODE", null as any)).rejects.toBeDefined();
  });
});

describe("getUserInviteCodes", () => {
  it("应返回用户创建的全部邀请码", async () => {
    const code = generateInviteCode();
    await saveInviteCode(code, userID, null);
    const codes = await getUserInviteCodes(userID);
    expect(Array.isArray(codes)).toBe(true);
    expect(codes.length).toBeGreaterThanOrEqual(1);
    expect(codes[0].code).toBeDefined();
    expect(codes[0].codeCreator).toBeDefined();
  });

  it("无 ID 应抛错", async () => {
    await expect(getUserInviteCodes(null as any)).rejects.toBe("no id");
  });
});
