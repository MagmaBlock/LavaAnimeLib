import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFilesByID } from "../../services/v2/anime/file.js";

vi.mock("axios", () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      ...mockInstance,
      create: vi.fn(() => mockInstance),
    },
  };
});

import axios from "axios";

const mockAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFilesByID", () => {
  it("AList 返回列表时应有解析结果", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        code: 200,
        data: {
          content: [
            { name: "ep01.mkv", size: 1024, modified: "2026-01-01", is_dir: false, thumb: "", sign: "abc123" },
            { name: "Subs", size: 0, modified: "2026-01-01", is_dir: true, thumb: "" },
          ],
          provider: "Local",
        },
      },
    });

    const result = await getFilesByID(1, "1A");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);

    const file = result.find((f: any) => f.type === "file");
    expect(file).toBeDefined();
    expect(file!.name).toBe("ep01.mkv");
    expect(file!.parseResult).toBeDefined();
    expect(file!.url).toBeDefined();

    const dir = result.find((f: any) => f.type === "dir");
    expect(dir).toBeDefined();
    expect(dir!.name).toBe("Subs");
  });

  it("AList 返回 not found 时应返回空数组", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        code: 500,
        message: "something not found",
      },
    });

    const result = await getFilesByID(1, "1A");
    expect(result).toEqual([]);
  });

  it("AList 返回未知错误时应返回错误字符串", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        code: 500,
        message: "internal error",
      },
    });

    const result = await getFilesByID(1, "1A");
    expect(typeof result).toBe("string");
    expect(result).toContain("意外错误");
  });

  it("不存在的 laID 应返回 404 字符串", async () => {
    const result = await getFilesByID(9999, "1A");
    expect(result).toBe("此 laID 不存在");
  });

  it("不存在的 Drive ID 应返回错误字符串", async () => {
    const result = await getFilesByID(1, "nonexistent_drive");
    expect(typeof result).toBe("string");
    expect(result).toBe("存储节点不存在");
  });
});
