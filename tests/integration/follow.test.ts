import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

const request = supertest(app);
const TS = Date.now();

let token: string;

beforeAll(async () => {
  await request.post("/v2/user/register").send({
    email: `follow_${TS}@t.com`,
    password: "FollowTest1",
    name: `follow_${TS}`,
    inviteCode: "TESTCODE001",
  });
  const loginRes = await request.post("/v2/user/login").send({
    account: `follow_${TS}`,
    password: "FollowTest1",
  });
  token = loginRes.body.data.token.value;
});

describe("POST /v2/anime/follow/edit", () => {
  it("缺少参数应返回 400", async () => {
    const res = await request
      .post("/v2/anime/follow/edit")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(400);
  });

  it("未登录应返回 401", async () => {
    const res = await request
      .post("/v2/anime/follow/edit")
      .send({ id: 1, status: 1 });
    expect(res.status).toBe(401);
  });

  it("添加追番应返回 200", async () => {
    const res = await request
      .post("/v2/anime/follow/edit")
      .set("Authorization", token)
      .send({ id: 1, status: 1 });
    expect(res.status).toBe(200);
  });

  it("再次添加相同番剧应返回 200（幂等）", async () => {
    const res = await request
      .post("/v2/anime/follow/edit")
      .set("Authorization", token)
      .send({ id: 1, status: 1 });
    expect(res.status).toBe(200);
  });

  it("追番第二部番剧", async () => {
    const res = await request
      .post("/v2/anime/follow/edit")
      .set("Authorization", token)
      .send({ id: 2, status: 1 });
    expect(res.status).toBe(200);
  });
});

describe("GET /v2/anime/follow/info", () => {
  it("已追番的番剧应返回 status=1", async () => {
    const res = await request
      .get("/v2/anime/follow/info")
      .set("Authorization", token)
      .query({ id: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(1);
  });

  it("未追番的番剧应返回 status=-1", async () => {
    const res = await request
      .get("/v2/anime/follow/info")
      .set("Authorization", token)
      .query({ id: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(-1);
  });
});

describe("POST /v2/anime/follow/list", () => {
  it("返回追番列表", async () => {
    const res = await request
      .post("/v2/anime/follow/list")
      .set("Authorization", token)
      .send({ status: [1], page: 1, pageSize: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("无效 status 应返回 400", async () => {
    const res = await request
      .post("/v2/anime/follow/list")
      .set("Authorization", token)
      .send({ status: [99], page: 1, pageSize: 10 });
    expect(res.status).toBe(400);
  });
});

describe("GET /v2/anime/follow/total", () => {
  it("返回追番统计", async () => {
    const res = await request
      .get("/v2/anime/follow/total")
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(typeof res.body.data).toBe("object");
  });
});

describe("POST /v2/anime/follow/edit (移除追番)", () => {
  it("移除追番应返回 200", async () => {
    const res = await request
      .post("/v2/anime/follow/edit")
      .set("Authorization", token)
      .send({ id: 1, status: 1, remove: true });
    expect(res.status).toBe(200);
  });

  it("移除后 info 应返回 status=-1", async () => {
    const res = await request
      .get("/v2/anime/follow/info")
      .set("Authorization", token)
      .query({ id: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(-1);
  });
});
