import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    bangumiImage: { host: "https://img.example.com", appendPoster: true },
  },
}));

vi.mock("../../common/env.js", () => ({ default: mockConfig }));

import { rewriteBgmImageUrl, appendPosterSuffix } from "../../common/tools/bangumi-image.js";

beforeEach(() => {
  mockConfig.bangumiImage.host = "https://img.example.com";
  mockConfig.bangumiImage.appendPoster = true;
});

describe("rewriteBgmImageUrl", () => {
  it("null/undefined 输入应返回 null", () => {
    expect(rewriteBgmImageUrl(null)).toBeNull();
    expect(rewriteBgmImageUrl(undefined)).toBeNull();
    expect(rewriteBgmImageUrl("")).toBeNull();
  });

  it("应将 lain.bgm.tv 替换为配置的 host", () => {
    mockConfig.bangumiImage.host = "https://cdn.example.com";
    expect(rewriteBgmImageUrl("https://lain.bgm.tv/pic/1.jpg")).toBe("https://cdn.example.com/pic/1.jpg");
  });

  it("应去除 host 末尾的斜杠", () => {
    mockConfig.bangumiImage.host = "https://cdn.example.com/";
    expect(rewriteBgmImageUrl("https://lain.bgm.tv/pic/1.jpg")).toBe("https://cdn.example.com/pic/1.jpg");
  });

  it("应去除 host 末尾的多个斜杠", () => {
    mockConfig.bangumiImage.host = "https://cdn.example.com//";
    expect(rewriteBgmImageUrl("https://lain.bgm.tv/pic/1.jpg")).toBe("https://cdn.example.com/pic/1.jpg");
  });

  it("host 与原始 host 相同时应原样返回", () => {
    mockConfig.bangumiImage.host = "https://lain.bgm.tv";
    expect(rewriteBgmImageUrl("https://lain.bgm.tv/pic/1.jpg")).toBe("https://lain.bgm.tv/pic/1.jpg");
  });

  it("匹配应不区分大小写", () => {
    mockConfig.bangumiImage.host = "https://cdn.example.com";
    expect(rewriteBgmImageUrl("https://LAIN.bgm.tv/pic/1.jpg")).toBe("https://cdn.example.com/pic/1.jpg");
  });

  it("仅替换 host 部分，保留路径", () => {
    mockConfig.bangumiImage.host = "https://cdn.example.com";
    const url = "https://lain.bgm.tv/r/400/pic/cover/l/12/34/123456_abc.jpg";
    expect(rewriteBgmImageUrl(url)).toBe("https://cdn.example.com/r/400/pic/cover/l/12/34/123456_abc.jpg");
  });

  it("非 bangumi 域名的 URL 应保持不变（仅替换前缀）", () => {
    mockConfig.bangumiImage.host = "https://cdn.example.com";
    expect(rewriteBgmImageUrl("https://other.example.com/pic/1.jpg")).toBe("https://other.example.com/pic/1.jpg");
  });
});

describe("appendPosterSuffix", () => {
  it("null/undefined 输入应返回 null", () => {
    expect(appendPosterSuffix(null)).toBeNull();
    expect(appendPosterSuffix(undefined)).toBeNull();
    expect(appendPosterSuffix("")).toBeNull();
  });

  it("appendPoster=true 时应在末尾追加 /poster", () => {
    mockConfig.bangumiImage.appendPoster = true;
    expect(appendPosterSuffix("https://cdn.example.com/pic/1.jpg")).toBe("https://cdn.example.com/pic/1.jpg/poster");
  });

  it("appendPoster=false 时应原样返回", () => {
    mockConfig.bangumiImage.appendPoster = false;
    expect(appendPosterSuffix("https://cdn.example.com/pic/1.jpg")).toBe("https://cdn.example.com/pic/1.jpg");
  });
});
