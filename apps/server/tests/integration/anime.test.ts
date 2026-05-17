import { describe, it, expect } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

const request = supertest(app);

describe("GET /v2/anime/get", () => {
  it("存在 ID 应返回 200 + 番剧数据", async () => {
    const res = await request.get("/v2/anime/get").query({ id: 1 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.title).toBe("测试番剧A");
    expect(res.body.data.images).toBeDefined();
  });

  it("不存在的 ID 应返回 404", async () => {
    const res = await request.get("/v2/anime/get").query({ id: 9999 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
  });

  it("非数字 ID 应返回 400", async () => {
    const res = await request.get("/v2/anime/get").query({ id: "abc" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
  });

  it("已删除的番剧应返回 404", async () => {
    const res = await request.get("/v2/anime/get").query({ id: 4 });
    expect(res.status).toBe(404);
  });

  it("full=true 应返回完整数据", async () => {
    const res = await request.get("/v2/anime/get").query({ id: 1, full: true });
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBeDefined();
    expect(res.body.data.images).toBeDefined();
  });
});

describe("POST /v2/anime/get (batch)", () => {
  it("批量查询应返回数组", async () => {
    const res = await request
      .post("/v2/anime/get")
      .send({ ids: [1, 2, 3] });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(3);
  });

  it("ids 超过 80 个应返回 400", async () => {
    const res = await request
      .post("/v2/anime/get")
      .send({ ids: Array.from({ length: 80 }, (_, i) => i) });
    expect(res.status).toBe(400);
  });

  it("ids 非数组应返回 400", async () => {
    const res = await request
      .post("/v2/anime/get")
      .send({ ids: "not_array" });
    expect(res.status).toBe(400);
  });
});

describe("GET /v2/anime/bangumi/get", () => {
  it("存在 bgmid 应返回动漫数据", async () => {
    const res = await request.get("/v2/anime/bangumi/get").query({ bgmid: 123456 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("不存在的 bgmid 应返回空数组", async () => {
    const res = await request.get("/v2/anime/bangumi/get").query({ bgmid: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("非法 bgmid 应返回 400", async () => {
    const res = await request.get("/v2/anime/bangumi/get").query({ bgmid: 0 });
    expect(res.status).toBe(400);
  });
});

describe("GET /v2/anime/recent-update/get", () => {
  it("应返回最近更新列表", async () => {
    const res = await request.get("/v2/anime/recent-update/get");
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("应支持 skip/take 参数", async () => {
    const res = await request
      .get("/v2/anime/recent-update/get")
      .query({ skip: 0, take: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it("负数 skip 应返回 400", async () => {
    const res = await request
      .get("/v2/anime/recent-update/get")
      .query({ skip: -1 });
    expect(res.status).toBe(400);
  });
});
