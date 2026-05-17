import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

const request = supertest(app);
const TS = Date.now();

let token: string;

beforeAll(async () => {
  await request.post("/v2/user/register").send({
    email: `hist_${TS}@t.com`,
    password: "HistTest11",
    name: `hist_${TS}`,
    inviteCode: "TESTCODE001",
  });
  const loginRes = await request.post("/v2/user/login").send({
    account: `hist_${TS}`,
    password: "HistTest11",
  });
  token = loginRes.body.data.token.value;
});

describe("POST /v2/anime/history/report", () => {
  it("未登录应返回 401", async () => {
    const res = await request.post("/v2/anime/history/report").send({
      animeID: 1,
      fileName: "ep01.mp4",
      currentTime: 120,
      totalTime: 1800,
      watchMethod: "browser",
    });
    expect(res.status).toBe(401);
  });

  it("缺少参数应返回 400", async () => {
    const res = await request
      .post("/v2/anime/history/report")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(400);
  });

  it("上报观看记录应返回 200", async () => {
    const res = await request
      .post("/v2/anime/history/report")
      .set("Authorization", token)
      .send({
        animeID: 1,
        fileName: "ep01.mp4",
        currentTime: 120,
        totalTime: 1800,
        watchMethod: "browser",
      });
    expect(res.status).toBe(200);
  });

  it("currentTime > totalTime 应返回 400", async () => {
    const res = await request
      .post("/v2/anime/history/report")
      .set("Authorization", token)
      .send({
        animeID: 1,
        fileName: "ep02.mp4",
        currentTime: 9999,
        totalTime: 100,
        watchMethod: "browser",
      });
    expect(res.status).toBe(400);
  });
});

describe("POST /v2/anime/history/my", () => {
  it("未登录应返回 401", async () => {
    const res = await request.post("/v2/anime/history/my").send({});
    expect(res.status).toBe(401);
  });

  it("返回观看历史", async () => {
    const res = await request
      .post("/v2/anime/history/my")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("应包含上报的记录", async () => {
    const res = await request
      .post("/v2/anime/history/my")
      .set("Authorization", token)
      .send({});
    const record = res.body.data.find((r: any) => r.fileName === "ep01.mp4");
    expect(record).toBeDefined();
    expect(record.animeID).toBe(1);
  });
});
