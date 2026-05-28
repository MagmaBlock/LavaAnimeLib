import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlistDriver } from "../../common/filesystem/alist-driver.js";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock("axios", () => {
  const mockInstance = { post: mockPost, get: vi.fn(), put: vi.fn(), delete: vi.fn() };
  return {
    default: {
      ...mockInstance,
      create: vi.fn(() => mockInstance),
    },
  };
});

function createTestDriver(overrides?: Partial<{ host: string; path: string; password: string }>) {
  return new AlistDriver({
    host: overrides?.host ?? "https://alist.example.com",
    path: overrides?.path ?? "/media/anime",
    password: overrides?.password ?? "",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("list", () => {
  it("应使用归一化路径并返回归一化条目", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        code: 200,
        message: "success",
        data: {
          content: [
            { name: "ep01.mkv", size: 1048576, modified: "2026-01-01T00:00:00Z", is_dir: false, sign: "sign1" },
            { name: "Subs", size: 0, modified: "2026-01-01T00:00:00Z", is_dir: true },
          ],
        },
      },
    });

    const driver = createTestDriver();
    const result = await driver.list("/2024/TV/Show");  // 归一化路径

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: "ep01.mkv",
      path: "/2024/TV/Show/ep01.mkv",  // 已剥离 rootPath 前缀
      type: "file",
      size: 1048576,
      sign: "sign1",
    });
    expect(result[1]).toMatchObject({
      name: "Subs",
      type: "dir",
      size: 0,
    });

    // 驱动内部将归一化路径 prepend rootPath 后调用 API
    expect(mockPost).toHaveBeenCalledWith("/api/fs/list", {
      path: "/media/anime/2024/TV/Show",
      password: "",
      page: 1,
      per_page: 0,
    });
  });

  it("应传递 password", async () => {
    mockPost.mockResolvedValueOnce({
      data: { code: 200, message: "ok", data: { content: [] } },
    });

    const driver = createTestDriver({ password: "secret123" });
    await driver.list("/some/path");

    expect(mockPost).toHaveBeenCalledWith("/api/fs/list", expect.objectContaining({
      password: "secret123",
    }));
  });

  it("空目录应返回空数组", async () => {
    mockPost.mockResolvedValueOnce({
      data: { code: 200, message: "ok", data: { content: [] } },
    });

    const driver = createTestDriver();
    const result = await driver.list("/empty");
    expect(result).toEqual([]);
  });

  it("AList 返回 500 + not found 时应返回空数组", async () => {
    mockPost.mockResolvedValueOnce({
      data: { code: 500, message: "path not found" },
    });

    const driver = createTestDriver();
    const result = await driver.list("/nonexistent");
    expect(result).toEqual([]);
  });

  it("AList 返回非 200 未知错误时应抛出异常", async () => {
    mockPost.mockResolvedValueOnce({
      data: { code: 500, message: "internal server error" },
    });

    const driver = createTestDriver();
    await expect(driver.list("/broken")).rejects.toThrow("AList API 错误: internal server error");
  });

  it("应支持分页参数", async () => {
    mockPost.mockResolvedValueOnce({
      data: { code: 200, message: "ok", data: { content: [] } },
    });

    const driver = createTestDriver();
    await driver.list("/path", { page: 3, pageSize: 50 });

    expect(mockPost).toHaveBeenCalledWith("/api/fs/list", expect.objectContaining({
      page: 3,
      per_page: 50,
    }));
  });

  it("归一化路径所含的多个斜杠应被规整", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        code: 200, message: "ok",
        data: { content: [{ name: "video.mkv", size: 100, modified: "", is_dir: false }] },
      },
    });

    const driver = createTestDriver();
    const result = await driver.list("/base//extra/");
    expect(result[0].path).toBe("/base/extra/video.mkv");
  });

  it("根路径 / 应正确映射", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        code: 200, message: "ok",
        data: {
          content: [
            { name: "2024", size: 0, modified: "", is_dir: true },
          ],
        },
      },
    });

    const driver = createTestDriver();
    const result = await driver.list("/");
    expect(result[0].path).toBe("/2024");
    expect(mockPost).toHaveBeenCalledWith("/api/fs/list", expect.objectContaining({
      path: "/media/anime",
    }));
  });
});

describe("getDownloadUrl", () => {
  it("entry.path 为归一化路径，应正确拼接下载 URL", () => {
    const driver = createTestDriver();
    const url = driver.getDownloadUrl(
      { name: "ep01.mkv", path: "/2024/TV/Show/ep01.mkv", type: "file", size: 100, modified: "", sign: "abc123" },
      "https://public.example.com",
    );

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://public.example.com");
    expect(parsed.pathname).toBe("/d/media/anime/2024/TV/Show/ep01.mkv");
    expect(parsed.searchParams.get("sign")).toBe("abc123");
  });

  it("无 sign 的条目不应添加 sign 参数", () => {
    const driver = createTestDriver();
    const url = driver.getDownloadUrl(
      { name: "ep01.mkv", path: "/show/ep01.mkv", type: "file", size: 100, modified: "", sign: undefined },
      "https://public.example.com",
    );

    expect(url).not.toContain("sign=");
  });

  it("应去除路径首尾多余斜杠", () => {
    const driver = createTestDriver({ path: "/anime/" });
    const url = driver.getDownloadUrl(
      { name: "ep01.mkv", path: "/show/ep01.mkv", type: "file", size: 100, modified: "" },
      "https://public.example.com/",
    );

    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/d/anime/show/ep01.mkv");
  });

  it("应支持 Unicode 路径", () => {
    const driver = createTestDriver({ path: "/番剧库" });
    const url = driver.getDownloadUrl(
      { name: "第01話.mkv", path: "/2024/某番剧/第01話.mkv", type: "file", size: 100, modified: "" },
      "https://public.example.com",
    );

    expect(url).toContain("/d/");
    expect(decodeURIComponent(url)).toContain("/d/番剧库/2024");
  });
});

describe("type", () => {
  it("应返回 'alist'", () => {
    expect(createTestDriver().type).toBe("alist");
  });
});
