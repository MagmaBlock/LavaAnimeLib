import { describe, it, expect } from "vitest";
import {
  getDriveList,
  getDrive,
  getDefaultDrive,
} from "../../services/v2/drive/index.js";

describe("getDriveList", () => {
  it("应返回 default 和 list", () => {
    const result = getDriveList();
    expect(result.default).toBe("1A");
    expect(Array.isArray(result.list)).toBe(true);
  });

  it("list 中的项不应包含敏感字段", () => {
    const result = getDriveList();
    for (const drive of result.list) {
      expect(drive).not.toHaveProperty("host");
      expect(drive).not.toHaveProperty("path");
      expect(drive).not.toHaveProperty("password");
    }
  });

  it("list 中的项应包含公开字段", () => {
    const result = getDriveList();
    const drive = result.list[0];
    expect(drive).toHaveProperty("id");
    expect(drive).toHaveProperty("name");
    expect(drive).toHaveProperty("description");
    expect(drive).toHaveProperty("banNSFW");
  });
});

describe("getDrive", () => {
  it("存在的 ID 应返回对应 Drive", () => {
    const drive = getDrive("1A");
    expect(drive).toBeDefined();
    expect(drive!.id).toBe("1A");
    expect(drive!.host).toBe("https://alist.example.com");
  });

  it("不存在的 ID 应返回 undefined", () => {
    expect(getDrive("nonexistent")).toBeUndefined();
  });

  it("空值应抛出异常", () => {
    expect(() => getDrive("")).toThrow();
    expect(() => getDrive(null as any)).toThrow();
    expect(() => getDrive(undefined as any)).toThrow();
  });
});

describe("getDefaultDrive", () => {
  it("应返回配置中的 default", () => {
    expect(getDefaultDrive()).toBe("1A");
  });
});
