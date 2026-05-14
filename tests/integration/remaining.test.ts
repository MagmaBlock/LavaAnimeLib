import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

const request = supertest(app);
const TS = Date.now();

let token: string;

beforeAll(async () => {
  await request.post("/v2/user/register").send({
    email: `rem_${TS}@t.com`,
    password: "RemTest11",
    name: `rem_${TS}`,
    inviteCode: "TESTCODE001",
  });
  const loginRes = await request.post("/v2/user/login").send({
    account: `rem_${TS}`,
    password: "RemTest11",
  });
  token = loginRes.body.data.token.value;
});

describe("GET /v2/index/info", () => {
  it("应返回年份和类型列表", async () => {
    const res = await request.get("/v2/index/info");
    expect(res.status).toBe(200);
    expect(res.body.data.year).toBeDefined();
    expect(res.body.data.type).toBeDefined();
    expect(res.body.data.year.length).toBeGreaterThan(0);
  });
});

describe("POST /v2/index/query", () => {
  it("按年份查询应返回结果", async () => {
    const res = await request
      .post("/v2/index/query")
      .send({ year: "2026年" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("空查询应返回 400", async () => {
    const res = await request
      .post("/v2/index/query")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /v2/search/hot", () => {
  it("应返回热门搜索列表", async () => {
    const res = await request.get("/v2/search/hot");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /v2/search/", () => {
  it("未登录应返回 401", async () => {
    const res = await request.get("/v2/search/").query({ value: "测试" });
    expect(res.status).toBe(401);
  });

  it("搜索结果应返回数组", async () => {
    const res = await request
      .get("/v2/search/")
      .set("Authorization", token)
      .query({ value: "测试" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("缺少 value 应返回 400", async () => {
    const res = await request
      .get("/v2/search/")
      .set("Authorization", token);
    expect(res.status).toBe(400);
  });
});

describe("GET /v2/search/quick", () => {
  it("快速搜索应返回建议列表", async () => {
    const res = await request
      .get("/v2/search/quick")
      .set("Authorization", token)
      .query({ value: "测试" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /v2/home/header/get", () => {
  it("应返回主页横幅列表", async () => {
    const res = await request.get("/v2/home/header/get");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /v2/drive/all", () => {
  it("应返回存储节点列表", async () => {
    const res = await request.get("/v2/drive/all");
    expect(res.status).toBe(200);
    expect(res.body.data.list).toBeDefined();
    expect(Array.isArray(res.body.data.list)).toBe(true);
  });
});

describe("GET /v2/site/setting/get", () => {
  it("存在的 key 应返回值", async () => {
    const res = await request
      .get("/v2/site/setting/get")
      .query({ key: "site_name" });
    expect(res.status).toBe(200);
    expect(res.body.data).toBe("LavaAnime Test");
  });

  it("不存在的 key 应返回 404", async () => {
    const res = await request
      .get("/v2/site/setting/get")
      .query({ key: "nonexistent_key" });
    expect(res.status).toBe(404);
  });

  it("缺少 key 应返回 400", async () => {
    const res = await request.get("/v2/site/setting/get");
    expect(res.status).toBe(400);
  });
});

describe("POST /v2/site/setting/set", () => {
  it("未登录应返回 401", async () => {
    const res = await request
      .post("/v2/site/setting/set")
      .send({ key: "test_key", value: "test_value" });
    expect(res.status).toBe(401);
  });

  it("设置值应返回 200", async () => {
    const res = await request
      .post("/v2/site/setting/set")
      .set("Authorization", token)
      .send({ key: "test_key", value: "test_value" });
    expect(res.status).toBe(200);
  });

  it("设置后可通过 get 查询到", async () => {
    const res = await request
      .get("/v2/site/setting/get")
      .query({ key: "test_key" });
    expect(res.status).toBe(200);
    expect(res.body.data).toBe("test_value");
  });
});

describe("GET /v2/anime/file", () => {
  it("未登录应返回 401", async () => {
    const res = await request
      .get("/v2/anime/file")
      .query({ id: 1 });
    expect(res.status).toBe(401);
  });

  it("缺少 drive 应返回 400", async () => {
    const res = await request
      .get("/v2/anime/file")
      .set("Authorization", token)
      .query({ id: 1 });
    expect(res.status).toBe(400);
  });

  it("登录后尝试获取文件（外部 AList 不可用，预期 500）", async () => {
    const res = await request
      .get("/v2/anime/file")
      .set("Authorization", token)
      .query({ id: 1, drive: "1A" });
    expect(res.status).toBe(500);
  });
});

describe("POST /v2/report/upload-message", () => {
  it("缺少参数应返回 400", async () => {
    const res = await request
      .post("/v2/report/upload-message")
      .send({});
    expect(res.status).toBe(400);
  });

  it("有效上报应返回 200", async () => {
    const res = await request
      .post("/v2/report/upload-message")
      .send({
        index: "2026年/1月冬/测试番剧A 123456",
        fileName: "test_episode.mkv",
      });
    expect(res.status).toBe(200);
  });
});
