import { describe, it, expect, beforeEach } from "vitest";
import cache from "../../common/cache.js";
import {
  createToken,
  saveToken,
  useToken,
  removeToken,
} from "../../services/v2/user/token.js";

describe("createToken", () => {
  it("应返回非空字母数字字符串", () => {
    const token = createToken();
    expect(token).toBeTruthy();
    expect(token).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("每次调用应返回不同的 token", () => {
    const token1 = createToken();
    const token2 = createToken();
    expect(token1).not.toBe(token2);
  });
});

describe("saveToken", () => {
  it("缺少参数应抛出异常", async () => {
    await expect(saveToken("", 1, new Date())).rejects.toThrow("参数错误");
    await expect(saveToken("abc", null, new Date())).rejects.toThrow("参数错误");
    await expect(saveToken("abc", 1, null)).rejects.toThrow("参数错误");
  });
});

describe("useToken", () => {
  it("空值应返回 false", async () => {
    expect(await useToken("")).toBe(false);
    expect(await useToken(null)).toBe(false);
    expect(await useToken(undefined)).toBe(false);
  });

  it("不存在的 token 应返回 false", async () => {
    expect(await useToken("nonexistent_token_value")).toBe(false);
  });
});

describe("removeToken", () => {
  it("不存在的 token 应返回 false", async () => {
    expect(await removeToken("nonexistent_token")).toBe(false);
  });

  it("空值应抛出异常", async () => {
    await expect(removeToken("")).rejects.toThrow("缺失参数");
  });
});

describe("token 完整生命周期", () => {
  beforeEach(() => {
    cache.token = {};
  });

  it("创建 → 保存 → 使用 → 注销 → 失效", async () => {
    const token = createToken();
    const future = new Date(Date.now() + 86_400_000);

    await saveToken(token, 1, future);
    const userID = await useToken(token);
    expect(userID).toBe(1);

    const removed = await removeToken(token);
    expect(removed).toBe(true);

    expect(await useToken(token)).toBe(false);
  });
});
