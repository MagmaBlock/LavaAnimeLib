import { describe, it, expect } from "vitest";
import {
  getHeader,
  updateHeader,
} from "../../services/v2/home/header.js";

describe("getHeader", () => {
  it("无数据时应返回空数组", async () => {
    const result = await getHeader();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("updateHeader", () => {
  it("设置后 get 应返回相同数据", async () => {
    const data = [{ title: "测试横幅", image: "https://example.com/banner.jpg" }];
    await updateHeader(data);
    const result = await getHeader();
    expect(result).toEqual(data);
  });

  it("多次更新应覆盖旧数据", async () => {
    await updateHeader([{ title: "第一版" }]);
    await updateHeader([{ title: "第二版" }]);
    const result = await getHeader();
    expect(result).toEqual([{ title: "第二版" }]);
  });

  it("非数组参数应抛错", async () => {
    await expect(updateHeader("not_array" as any)).rejects.toThrow();
    await expect(updateHeader({} as any)).rejects.toThrow();
    await expect(updateHeader(null as any)).rejects.toThrow();
  });
});
