import { describe, it, expect } from "vitest";
import {
  getSiteSetting,
  setSiteSetting,
} from "../../services/v2/site/setting.js";

describe("getSiteSetting", () => {
  it("存在的 key 应返回 JSON 解析后的值", async () => {
    const result = await getSiteSetting("site_name");
    expect(result).toBe("LavaAnime Test");
  });

  it("不存在的 key 应返回 null", async () => {
    const result = await getSiteSetting("nonexistent_key_xyz");
    expect(result).toBeNull();
  });
});

describe("setSiteSetting", () => {
  it("设置字符串值后 get 应返回相同值", async () => {
    const key = `test_str_${Date.now()}`;
    await setSiteSetting(key, "hello");
    const result = await getSiteSetting(key);
    expect(result).toBe("hello");
  });

  it("设置对象值后 get 应返回解析后的对象", async () => {
    const key = `test_obj_${Date.now()}`;
    const obj = { foo: "bar", num: 42 };
    await setSiteSetting(key, obj);
    const result = await getSiteSetting(key);
    expect(result).toEqual(obj);
  });

  it("设置数值后 get 应返回数值", async () => {
    const key = `test_num_${Date.now()}`;
    await setSiteSetting(key, 123);
    const result = await getSiteSetting(key);
    expect(result).toBe(123);
  });

  it("重复设置相同 key 应覆盖旧值", async () => {
    const key = `test_ovr_${Date.now()}`;
    await setSiteSetting(key, "first");
    await setSiteSetting(key, "second");
    const result = await getSiteSetting(key);
    expect(result).toBe("second");
  });
});
