import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

const request = supertest(app);
const TS = Date.now();

let token: string;
const testUser = `priv_${TS}`;

beforeAll(async () => {
  await request.post("/v2/user/register").send({
    email: `${testUser}@t.com`,
    password: "PrivTest1",
    name: testUser,
    inviteCode: "TESTCODE001",
  });
  const loginRes = await request.post("/v2/user/login").send({
    account: testUser,
    password: "PrivTest1",
  });
  token = loginRes.body.data.token.value;
});

describe("POST /v2/user/changepassword", () => {
  it("未登录应返回 401", async () => {
    const res = await request.post("/v2/user/changepassword").send({
      password: "NewPass123",
    });
    expect(res.status).toBe(401);
  });

  it("空 body 应返回 400", async () => {
    const res = await request
      .post("/v2/user/changepassword")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(400);
  });

  it("密码过短应返回 400（小于 7 位）", async () => {
    const res = await request
      .post("/v2/user/changepassword")
      .set("Authorization", token)
      .send({ password: "Ab1" });
    expect(res.status).toBe(400);
  });

  it("密码不含字母应返回 400", async () => {
    const res = await request
      .post("/v2/user/changepassword")
      .set("Authorization", token)
      .send({ password: "12345678" });
    expect(res.status).toBe(400);
  });

  it("有效密码应返回 200", async () => {
    const res = await request
      .post("/v2/user/changepassword")
      .set("Authorization", token)
      .send({ password: "NewPass123" });
    expect(res.status).toBe(200);
  });
});

describe("POST /v2/user/info/avatar", () => {
  it("未登录应返回 401", async () => {
    const res = await request.post("/v2/user/info/avatar").send({
      url: "https://example.com/avatar.jpg",
    });
    expect(res.status).toBe(401);
  });

  it("空 body 应返回 400", async () => {
    const res = await request
      .post("/v2/user/info/avatar")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(400);
  });

  it("无效 URL 应返回 400", async () => {
    const res = await request
      .post("/v2/user/info/avatar")
      .set("Authorization", token)
      .send({ url: "not-a-url" });
    expect(res.status).toBe(400);
  });

  it("有效 URL 应返回 200", async () => {
    const res = await request
      .post("/v2/user/info/avatar")
      .set("Authorization", token)
      .send({ url: "https://example.com/avatar.jpg" });
    expect(res.status).toBe(200);
  });
});

describe("POST /v2/user/info/name", () => {
  it("未登录应返回 401", async () => {
    const res = await request.post("/v2/user/info/name").send({
      name: "新名字",
    });
    expect(res.status).toBe(401);
  });

  it("空 body 应返回 400", async () => {
    const res = await request
      .post("/v2/user/info/name")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(400);
  });

  it("空名称应返回 400", async () => {
    const res = await request
      .post("/v2/user/info/name")
      .set("Authorization", token)
      .send({ name: "" });
    expect(res.status).toBe(400);
  });

  it("名称过长应返回 400（超过 30 字符）", async () => {
    const res = await request
      .post("/v2/user/info/name")
      .set("Authorization", token)
      .send({ name: "a".repeat(31) });
    expect(res.status).toBe(400);
  });

  it("有效名称应返回 200", async () => {
    const res = await request
      .post("/v2/user/info/name")
      .set("Authorization", token)
      .send({ name: `新名字_${TS}` });
    expect(res.status).toBe(200);
  });
});
