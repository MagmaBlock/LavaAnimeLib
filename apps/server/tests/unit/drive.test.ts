import { describe, it, expect } from "vitest";
import {
  getDriveList,
  getDrive,
  getDefaultDrive,
} from "../../services/v2/drive/index.js";
import { deleteDrive, updateDrive } from "../../services/v2/admin/drive.js";

describe("getDriveList", () => {
  it("应返回 default 和 list", async () => {
    const result = await getDriveList();
    expect(result.default).toBe("1A");
    expect(Array.isArray(result.list)).toBe(true);
  });

  it("list 中的项不应包含敏感字段", async () => {
    const result = await getDriveList();
    for (const drive of result.list) {
      expect(drive).not.toHaveProperty("host");
      expect(drive).not.toHaveProperty("path");
      expect(drive).not.toHaveProperty("password");
    }
  });

  it("list 中的项应包含公开字段", async () => {
    const result = await getDriveList();
    const drive = result.list[0];
    expect(drive).toHaveProperty("id");
    expect(drive).toHaveProperty("name");
    expect(drive).toHaveProperty("description");
    expect(drive).toHaveProperty("banNSFW");
    expect(drive).toHaveProperty("disableDownload");
  });

  it("list 中不应包含禁用节点", async () => {
    const result = await getDriveList();
    expect(result.list.find((drive) => drive.id === "2B")).toBeUndefined();
  });
});

describe("getDrive", () => {
  it("存在的 ID 应返回对应 Drive", async () => {
    const drive = await getDrive("1A");
    expect(drive).toBeDefined();
    expect(drive!.id).toBe("1A");
    expect(drive!.connectionConfigId).toBe(1);
  });

  it("不存在的 ID 应返回 undefined", async () => {
    await expect(getDrive("nonexistent")).resolves.toBeUndefined();
  });

  it("禁用的 ID 应返回 undefined", async () => {
    await expect(getDrive("2B")).resolves.toBeUndefined();
  });

  it("空值应抛出异常", async () => {
    await expect(getDrive("")).rejects.toThrow();
    await expect(getDrive(null as any)).rejects.toThrow();
    await expect(getDrive(undefined as any)).rejects.toThrow();
  });
});

describe("getDefaultDrive", () => {
  it("应返回数据库中的默认节点", async () => {
    await expect(getDefaultDrive()).resolves.toBe("1A");
  });
});

describe("admin drive mutations", () => {
  it("更新不存在的存储节点应抛出异常", async () => {
    await expect(updateDrive({
      id: "nonexistent",
      name: "不存在节点",
      description: "",
      connectionConfigId: null,
      banNSFW: false,
      disableDownload: false,
      enabled: true,
      isDefault: false,
      sortOrder: 0,
    })).rejects.toThrow("存储节点不存在");
  });

  it("删除不存在的存储节点应抛出异常", async () => {
    await expect(deleteDrive("nonexistent")).rejects.toThrow("存储节点不存在");
  });
});
