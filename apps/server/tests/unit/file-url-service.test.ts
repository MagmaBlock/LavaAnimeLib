import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDriverGetDownloadUrl = vi.fn();

vi.mock("../../services/v2/drive/index.js", () => ({
  getDrive: vi.fn(),
}));

vi.mock("../../common/filesystem/factory.js", () => ({
  createDriver: vi.fn(() => ({
    getDownloadUrl: mockDriverGetDownloadUrl,
  })),
}));

vi.mock("../../common/tools/parse-json-field.js", () => ({
  parseJsonField: vi.fn((val) => (val ? JSON.parse(val) : null)),
}));

vi.mock("../../common/database/connection.js", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    execute: vi.fn(),
  },
}));

import { getFileDownloadUrl } from "../../services/v2/anime/file-url.js";
import { getDrive } from "../../services/v2/drive/index.js";
import { db } from "../../common/database/connection.js";
import { parseJsonField } from "../../common/tools/parse-json-field.js";

const mockGetDrive = getDrive as ReturnType<typeof vi.fn>;
const mockDbSelect = db.select as ReturnType<typeof vi.fn>;
const mockParseJson = parseJsonField as ReturnType<typeof vi.fn>;

function mockDriveRecord(overrides?: Record<string, unknown>) {
  return {
    id: "DRV1",
    name: "驱动A",
    description: "",
    type: "alist",
    config: { host: "https://alist.example.com", path: "/data", password: "" },
    banNSFW: false,
    enabled: true,
    isDefault: true,
    sortOrder: 0,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function setupDbChainReturn(rows: Array<Record<string, unknown>>) {
  const limitOrOrder = vi.fn(() => Promise.resolve(rows));
  const where = vi.fn(() => ({ limit: limitOrOrder, orderBy: limitOrOrder }));
  const from = vi.fn(() => ({ where }));
  const selectResult = { from };
  mockDbSelect.mockReturnValue(selectResult);
  return { from, where, limitOrOrder };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDrive.mockResolvedValue(mockDriveRecord());
  mockDriverGetDownloadUrl.mockReturnValue("https://public.example.com/d/test.mkv");
  mockParseJson.mockImplementation((val) => (val ? JSON.parse(typeof val === "string" ? val : JSON.stringify(val)) : null));
});

describe("getFileDownloadUrl", () => {
  describe("驱动不存在", () => {
    it("应抛出 '存储节点不存在' 错误", async () => {
      mockGetDrive.mockResolvedValue(undefined);

      await expect(getFileDownloadUrl("bad", "/path/file.mkv")).rejects.toThrow("存储节点不存在");
    });
  });

  describe("无可用端点", () => {
    it("应抛出 '没有可用的对外节点' 错误", async () => {
      setupDbChainReturn([]);

      await expect(getFileDownloadUrl("DRV1", "/path/file.mkv")).rejects.toThrow("没有可用的对外节点");
    });
  });

  describe("指定 endpointId", () => {
    it("应使用指定端点获取 URL", async () => {
      setupDbChainReturn([
        { id: 42, configOverride: null },
      ]);

      const url = await getFileDownloadUrl("DRV1", "/path/ep.mkv", 42);

      expect(url).toBe("https://public.example.com/d/test.mkv");
      expect(mockDriverGetDownloadUrl).toHaveBeenCalledWith(
        expect.objectContaining({ name: "ep.mkv", path: "/path/ep.mkv" }),
        "https://alist.example.com",
      );
    });

    it("指定端点不存在时应抛出错误", async () => {
      setupDbChainReturn([]);

      await expect(getFileDownloadUrl("DRV1", "/path/file.mkv", 99)).rejects.toThrow("没有可用的对外节点");
    });
  });

  describe("不指定 endpointId（自动选择）", () => {
    it("应按 priority 选择第一个启用端点", async () => {
      setupDbChainReturn([
        { id: 10, configOverride: null },
      ]);

      const url = await getFileDownloadUrl("DRV1", "/path/ep.mkv");

      expect(url).toBe("https://public.example.com/d/test.mkv");
    });
  });

  describe("configOverride 合并", () => {
    it("端点有 configOverride 时应覆盖驱动默认配置", async () => {
      const override = { host: "https://override.example.com" };
      setupDbChainReturn([
        { id: 5, configOverride: JSON.stringify(override) },
      ]);

      await getFileDownloadUrl("DRV1", "/path/ep.mkv", 5);

      expect(mockDriverGetDownloadUrl).toHaveBeenCalledWith(
        expect.anything(),
        "https://override.example.com",
      );
    });
  });

  describe("正常 URL 生成", () => {
    it("应返回有效的 URL 字符串", async () => {
      setupDbChainReturn([
        { id: 1, configOverride: null },
      ]);

      const url = await getFileDownloadUrl("DRV1", "/path/to/video.mp4");

      expect(typeof url).toBe("string");
      expect(url).toBe("https://public.example.com/d/test.mkv");
    });

    it("文件名应从路径末尾提取", async () => {
      setupDbChainReturn([
        { id: 1, configOverride: null },
      ]);

      await getFileDownloadUrl("DRV1", "/deep/nested/path/episode.mkv");

      expect(mockDriverGetDownloadUrl).toHaveBeenCalledWith(
        expect.objectContaining({ name: "episode.mkv" }),
        expect.anything(),
      );
    });

    it("路径无分隔符时应使用路径本身作为文件名", async () => {
      setupDbChainReturn([
        { id: 1, configOverride: null },
      ]);

      await getFileDownloadUrl("DRV1", "singlefile.mkv");

      expect(mockDriverGetDownloadUrl).toHaveBeenCalledWith(
        expect.objectContaining({ name: "singlefile.mkv", path: "singlefile.mkv" }),
        expect.anything(),
      );
    });
  });
});
