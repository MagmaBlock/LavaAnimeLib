import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, makeMockChain, mockConfig } = vi.hoisted(() => {
  function makeMockChain(result: unknown = undefined) {
    const chain: Record<string, ReturnType<typeof vi.fn>> & { then: ReturnType<typeof vi.fn> } = {
      then: vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)),
    };
    ["from", "where", "leftJoin", "groupBy", "orderBy", "limit", "offset", "values", "set", "onDuplicateKeyUpdate", "$returningId"].forEach((name) => {
      chain[name] = vi.fn(() => chain);
    });
    return chain;
  }

  return {
    mockDb: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
    makeMockChain,
    mockConfig: {
      bangumiImage: { host: "https://cdn.example.com", appendPoster: true },
    },
  };
});

vi.mock("../../common/database/connection.js", () => ({ db: mockDb }));
vi.mock("../../common/env.js", () => ({ default: mockConfig }));

import { getCharacterDetail, getPersonDetail } from "../../services/v2/bangumi-wiki/index.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(makeMockChain([]));
  mockDb.insert.mockReturnValue(makeMockChain());
  mockDb.update.mockReturnValue(makeMockChain());
  mockDb.delete.mockReturnValue(makeMockChain());
  mockConfig.bangumiImage.host = "https://cdn.example.com";
});

describe("getCharacterDetail", () => {
  it("character 不存在时应返回 null", async () => {
    mockDb.select.mockReturnValueOnce(makeMockChain([]));
    const result = await getCharacterDetail(999);
    expect(result).toBeNull();
  });

  it("character 存在但无 subjects 时应返回空 subjects 数组", async () => {
    const char = {
      id: 1, name: "Char A", name_cn: "角色A", type: 1, summary: "summary",
      image_large: "https://lain.bgm.tv/pic/char_l.jpg",
      image_medium: "https://lain.bgm.tv/pic/char_m.jpg",
      image_small: "https://lain.bgm.tv/pic/char_s.jpg",
      image_grid: "https://lain.bgm.tv/pic/char_g.jpg",
    };
    mockDb.select
      .mockReturnValueOnce(makeMockChain([char]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await getCharacterDetail(1);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Char A");
    expect(result?.name_cn).toBe("角色A");
    expect(result?.subjects).toEqual([]);
    expect(result?.images?.large).toBe("https://cdn.example.com/pic/char_l.jpg");
    expect(result?.images?.medium).toBe("https://cdn.example.com/pic/char_m.jpg");
    expect(result?.images?.small).toBe("https://cdn.example.com/pic/char_s.jpg");
    expect(result?.images?.grid).toBe("https://cdn.example.com/pic/char_g.jpg");
  });

  it("character 无图片时 images 应为 null", async () => {
    const char = {
      id: 1, name: "Char A", name_cn: null, type: null, summary: null,
      image_large: null, image_medium: null, image_small: null, image_grid: null,
    };
    mockDb.select
      .mockReturnValueOnce(makeMockChain([char]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await getCharacterDetail(1);
    expect(result?.images).toBeNull();
  });

  it("应组装完整的 character detail 含 subjects、actors 和 careers", async () => {
    const char = {
      id: 1, name: "Char A", name_cn: "角色A", type: 1, summary: "summary",
      image_large: "https://lain.bgm.tv/pic/char_l.jpg",
      image_medium: null, image_small: null, image_grid: null,
    };
    const scRows = [{ subject_id: 10, relation: "主角" }];
    const subRows = [{ id: 10, bgmid: 123456, name: "Anime A", name_cn: "番剧A", image_large: "https://lain.bgm.tv/pic/sub.jpg" }];
    const animeRows = [{ id: 5, bgmid: "123456", poster: "https://example.com/poster.jpg" }];
    const scpRows = [{ subject_id: 10, person_id: 100 }];
    const pRows = [{
      id: 100, name: "Actor A",
      image_large: "https://lain.bgm.tv/pic/p_l.jpg",
      image_medium: "https://lain.bgm.tv/pic/p_m.jpg",
      image_small: null, image_grid: null,
    }];
    const careerRows = [{ id: 1, person_id: 100, career: "声优" }];

    mockDb.select
      .mockReturnValueOnce(makeMockChain([char]))
      .mockReturnValueOnce(makeMockChain(scRows))
      .mockReturnValueOnce(makeMockChain(subRows))
      .mockReturnValueOnce(makeMockChain(animeRows))
      .mockReturnValueOnce(makeMockChain(scpRows))
      .mockReturnValueOnce(makeMockChain(pRows))
      .mockReturnValueOnce(makeMockChain(careerRows));

    const result = await getCharacterDetail(1);
    expect(result).not.toBeNull();
    expect(result?.subjects).toHaveLength(1);
    const sub = result?.subjects[0];
    expect(sub?.bgmid).toBe(123456);
    expect(sub?.anime_id).toBe(5);
    expect(sub?.name).toBe("Anime A");
    expect(sub?.name_cn).toBe("番剧A");
    expect(sub?.poster).toBe("https://example.com/poster.jpg");
    expect(sub?.relation).toBe("主角");
    expect(sub?.actors).toHaveLength(1);
    expect(sub?.actors[0].id).toBe(100);
    expect(sub?.actors[0].name).toBe("Actor A");
    expect(sub?.actors[0].careers).toEqual(["声优"]);
    expect(sub?.actors[0].images?.large).toBe("https://cdn.example.com/pic/p_l.jpg");
    expect(sub?.actors[0].images?.medium).toBe("https://cdn.example.com/pic/p_m.jpg");
  });

  it("subject 无对应 anime 时 anime_id 与 poster 应为 null", async () => {
    const char = {
      id: 1, name: "Char A", name_cn: null, type: null, summary: null,
      image_large: null, image_medium: null, image_small: null, image_grid: null,
    };
    const scRows = [{ subject_id: 10, relation: "主角" }];
    const subRows = [{ id: 10, bgmid: 123456, name: "Anime A", name_cn: "番剧A", image_large: null }];
    const animeRows: never[] = [];
    const scpRows: never[] = [];

    mockDb.select
      .mockReturnValueOnce(makeMockChain([char]))
      .mockReturnValueOnce(makeMockChain(scRows))
      .mockReturnValueOnce(makeMockChain(subRows))
      .mockReturnValueOnce(makeMockChain(animeRows))
      .mockReturnValueOnce(makeMockChain(scpRows));

    const result = await getCharacterDetail(1);
    expect(result?.subjects[0].anime_id).toBeNull();
    expect(result?.subjects[0].poster).toBeNull();
    expect(result?.subjects[0].actors).toEqual([]);
  });
});

describe("getPersonDetail", () => {
  it("person 不存在时应返回 null", async () => {
    mockDb.select.mockReturnValueOnce(makeMockChain([]));
    const result = await getPersonDetail(999);
    expect(result).toBeNull();
  });

  it("person 存在但无 characters 时应返回空数组", async () => {
    const person = {
      id: 100, name: "Person A", type: 1, short_summary: "summary",
      locked: 0,
      image_large: "https://lain.bgm.tv/pic/p_l.jpg",
      image_medium: null, image_small: null, image_grid: null,
    };
    mockDb.select
      .mockReturnValueOnce(makeMockChain([person]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await getPersonDetail(100);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(100);
    expect(result?.name).toBe("Person A");
    expect(result?.locked).toBe(false);
    expect(result?.careers).toEqual([]);
    expect(result?.characters).toEqual([]);
    expect(result?.images?.large).toBe("https://cdn.example.com/pic/p_l.jpg");
  });

  it("locked=1 应转为 true", async () => {
    const person = {
      id: 100, name: "Person A", type: 1, short_summary: null, locked: 1,
      image_large: null, image_medium: null, image_small: null, image_grid: null,
    };
    mockDb.select
      .mockReturnValueOnce(makeMockChain([person]))
      .mockReturnValueOnce(makeMockChain([]));

    const result = await getPersonDetail(100);
    expect(result?.locked).toBe(true);
  });

  it("应组装完整的 person detail 含 careers 与 characters", async () => {
    const person = {
      id: 100, name: "Person A", type: 1, short_summary: "summary", locked: 0,
      image_large: "https://lain.bgm.tv/pic/p_l.jpg",
      image_medium: null, image_small: null, image_grid: null,
    };
    const careerRows = [
      { id: 1, person_id: 100, career: "声优" },
      { id: 2, person_id: 100, career: "歌手" },
    ];
    const scpRows = [{ character_id: 1, subject_id: 10 }];
    const charRows = [{
      id: 1, name: "Char A", name_cn: "角色A",
      image_large: "https://lain.bgm.tv/pic/c_l.jpg",
      image_medium: null, image_small: null, image_grid: null,
    }];
    const scRows = [{ character_id: 1, subject_id: 10, relation: "主角" }];
    const subRows = [{ id: 10, bgmid: 123456, name: "Anime A", name_cn: "番剧A", image_large: null }];
    const animeRows = [{ id: 5, bgmid: "123456", poster: "https://example.com/poster.jpg" }];

    mockDb.select
      .mockReturnValueOnce(makeMockChain([person]))
      .mockReturnValueOnce(makeMockChain(careerRows))
      .mockReturnValueOnce(makeMockChain(scpRows))
      .mockReturnValueOnce(makeMockChain(charRows))
      .mockReturnValueOnce(makeMockChain(scRows))
      .mockReturnValueOnce(makeMockChain(subRows))
      .mockReturnValueOnce(makeMockChain(animeRows));

    const result = await getPersonDetail(100);
    expect(result).not.toBeNull();
    expect(result?.careers).toEqual(["声优", "歌手"]);
    expect(result?.characters).toHaveLength(1);
    const char = result?.characters[0];
    expect(char?.character_id).toBe(1);
    expect(char?.name).toBe("Char A");
    expect(char?.relation).toBe("主角");
    expect(char?.subject?.bgmid).toBe(123456);
    expect(char?.subject?.anime_id).toBe(5);
    expect(char?.subject?.poster).toBe("https://example.com/poster.jpg");
    expect(char?.images?.large).toBe("https://cdn.example.com/pic/c_l.jpg");
  });

  it("person 的 character 关联不在 subject_characters 中时应过滤掉", async () => {
    const person = {
      id: 100, name: "Person A", type: 1, short_summary: null, locked: 0,
      image_large: null, image_medium: null, image_small: null, image_grid: null,
    };
    const scpRows = [{ character_id: 1, subject_id: 10 }];
    const charRows = [{
      id: 1, name: "Char A", name_cn: null,
      image_large: null, image_medium: null, image_small: null, image_grid: null,
    }];
    const scRows: never[] = [];

    mockDb.select
      .mockReturnValueOnce(makeMockChain([person]))
      .mockReturnValueOnce(makeMockChain([]))
      .mockReturnValueOnce(makeMockChain(scpRows))
      .mockReturnValueOnce(makeMockChain(charRows))
      .mockReturnValueOnce(makeMockChain(scRows));

    const result = await getPersonDetail(100);
    expect(result?.characters).toEqual([]);
  });
});
