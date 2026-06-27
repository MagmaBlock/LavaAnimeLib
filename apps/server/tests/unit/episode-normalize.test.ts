import { describe, it, expect } from "vitest";
import {
  normalizeEpisodeNumber,
  normalizeAbsoluteNumber,
  normalizeStructuredEpisodes,
  resolveFileEpisode,
} from "../../common/tools/episode-normalize.js";
import type { StructuredEpisode } from "@lavaanime/shared";

describe("normalizeEpisodeNumber (字串版)", () => {
  it("start<=1 或 null 时原样返回", () => {
    expect(normalizeEpisodeNumber("01", null)).toBe("01");
    expect(normalizeEpisodeNumber("13", 1)).toBe("13");
    expect(normalizeEpisodeNumber("13", undefined)).toBe("13");
  });

  it("低于 start 的正整数被上推", () => {
    expect(normalizeEpisodeNumber("01", 13)).toBe("13");
    expect(normalizeEpisodeNumber("12", 13)).toBe("24");
    expect(normalizeEpisodeNumber("08", 13)).toBe("20");
  });

  it(">= start 的编号不变", () => {
    expect(normalizeEpisodeNumber("13", 13)).toBe("13");
    expect(normalizeEpisodeNumber("25", 25)).toBe("25");
    expect(normalizeEpisodeNumber("48", 25)).toBe("48");
  });

  it("支持小数集数, 整数部分上推, 小数部分保留", () => {
    expect(normalizeEpisodeNumber("0.5", 13)).toBe("0.5"); // int <1 不归一化
    expect(normalizeEpisodeNumber("1.5", 13)).toBe("13.5");
    expect(normalizeEpisodeNumber("12.5", 13)).toBe("24.5");
    expect(normalizeEpisodeNumber("13.5", 13)).toBe("13.5");
  });

  it("非数字形态原样返回", () => {
    expect(normalizeEpisodeNumber("SP1", 13)).toBe("SP1");
    expect(normalizeEpisodeNumber("OVA", 13)).toBe("OVA");
    expect(normalizeEpisodeNumber("", 13)).toBe("");
    expect(normalizeEpisodeNumber(undefined, 13)).toBeUndefined();
    expect(normalizeEpisodeNumber(null, 13)).toBeUndefined();
  });

  it("数值传入也支持", () => {
    expect(normalizeEpisodeNumber(1, 13)).toBe("13");
    expect(normalizeEpisodeNumber(13, 13)).toBe("13");
    expect(normalizeEpisodeNumber(25, null)).toBe("25");
  });
});

describe("normalizeAbsoluteNumber (数值版)", () => {
  it("start<=1 无偏移", () => {
    expect(normalizeAbsoluteNumber(5, 1)).toBe(5);
    expect(normalizeAbsoluteNumber(5, null)).toBe(5);
  });
  it("正整数低段上推", () => {
    expect(normalizeAbsoluteNumber(1, 13)).toBe(13);
    expect(normalizeAbsoluteNumber(12, 13)).toBe(24);
  });
  it(">=start 与无法解析的值不变", () => {
    expect(normalizeAbsoluteNumber(13, 13)).toBe(13);
    expect(normalizeAbsoluteNumber(0.5, 13)).toBe(0.5);
    expect(normalizeAbsoluteNumber(Number.NaN, 13)).toBeNaN();
  });
});

describe("normalizeStructuredEpisodes", () => {
  const eps: StructuredEpisode[] = [
    { id: 1, type: 0, sort: 1 },
    { id: 2, type: 0, sort: 12 },
    { id: 3, type: 0, sort: 25 },
    { id: 4, type: 1, sort: 0.5 }, // SP 不归一化
    { id: 5, type: 2, sort: 13.5 }, // OP 不归一化
  ];
  it("start<=1 时整表不变", () => {
    expect(normalizeStructuredEpisodes(eps, 1)).toEqual(eps);
    expect(normalizeStructuredEpisodes(eps, null)).toEqual(eps);
  });
  it("只归一化本篇 type=0, SP/OP/ED 不变", () => {
    const out = normalizeStructuredEpisodes(eps, 13);
    expect(out[0].sort).toBe(13); // 1 -> 13
    expect(out[1].sort).toBe(24); // 12 -> 24
    expect(out[2].sort).toBe(25); // 25 不变
    expect(out[3].sort).toBe(0.5); // SP 不变
    expect(out[4].sort).toBe(13.5); // OP 不变
  });
});

describe("resolveFileEpisode", () => {
  it("有原始集数则归一化", () => {
    expect(
      resolveFileEpisode("01", "video", { episode_start: 13, eps: 24 })
    ).toBe("13");
    expect(
      resolveFileEpisode("13", "video", { episode_start: 13, eps: 24 })
    ).toBe("13");
  });
  it("无集数 + eps==1 + video: 归并到唯一按钮", () => {
    expect(
      resolveFileEpisode("", "video", { episode_start: null, eps: 1 })
    ).toBe("01");
    expect(
      resolveFileEpisode(undefined, "video", { episode_start: 25, eps: 1 })
    ).toBe("25");
  });
  it("无集数 + eps!=1: 仍归为无集数", () => {
    expect(
      resolveFileEpisode("", "video", { episode_start: 13, eps: 24 })
    ).toBeUndefined();
    expect(
      resolveFileEpisode(undefined, "video", { episode_start: 13, eps: null })
    ).toBeUndefined();
  });
  it("无集数 + 非视频不归并", () => {
    expect(
      resolveFileEpisode("", "music", { episode_start: 1, eps: 1 })
    ).toBeUndefined();
  });
});