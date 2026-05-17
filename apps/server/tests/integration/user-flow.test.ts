import { describe, it, expect } from "vitest";
import supertest from "supertest";
import app from "../../app.js";

const request = supertest(app);

const TS = Date.now();

describe("POST /v2/user/register", () => {
  it("缺少参数应返回 400", async () => {
    const res = await request.post("/v2/user/register").send({});
    expect(res.status).toBe(400);
  });

  it("无效邮箱应返回 400", async () => {
    const res = await request.post("/v2/user/register").send({
      email: "bad-email",
      password: "test1234",
      name: `u1_${TS}`,
      inviteCode: "TESTCODE001",
    });
    expect(res.status).toBe(400);
  });

  it("无效邀请码应返回 400", async () => {
    const res = await request.post("/v2/user/register").send({
      email: `badcode_${TS}@t.com`,
      password: "test1234",
      name: `u2_${TS}`,
      inviteCode: "WRONGCODE",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("邀请码");
  });

  it("已使用的邀请码应返回 400", async () => {
    const res = await request.post("/v2/user/register").send({
      email: `usedcode_${TS}@t.com`,
      password: "test1234",
      name: `u3_${TS}`,
      inviteCode: "USEDCODE001",
    });
    expect(res.status).toBe(400);
  });

  it("有效注册应返回 200", async () => {
    const res = await request.post("/v2/user/register").send({
      email: `flow_${TS}@t.com`,
      password: "TestPass123",
      name: `fuser_${TS}`,
      inviteCode: "TESTCODE001",
    });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  it("重复邮箱应返回 400", async () => {
    const res = await request.post("/v2/user/register").send({
      email: `flow_${TS}@t.com`,
      password: "test1234",
      name: `u4_${TS}`,
      inviteCode: "TESTCODE002",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("邮箱");
  });

  it("重复用户名应返回 400", async () => {
    const res = await request.post("/v2/user/register").send({
      email: `dupname_${TS}@t.com`,
      password: "test1234",
      name: `fuser_${TS}`,
      inviteCode: "TESTCODE002",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("昵称");
  });
});

let token: string;

describe("POST /v2/user/login", () => {
  it("缺少参数应返回 400", async () => {
    const res = await request.post("/v2/user/login").send({});
    expect(res.status).toBe(400);
  });

  it("不存在的用户应返回 404", async () => {
    const res = await request.post("/v2/user/login").send({
      account: "nonexistent",
      password: "test1234",
    });
    expect(res.status).toBe(404);
  });

  it("错误密码应返回 400", async () => {
    const res = await request.post("/v2/user/login").send({
      account: `fuser_${TS}`,
      password: "wrong_password",
    });
    expect(res.status).toBe(400);
  });

  it("正确凭据应返回 200 + token", async () => {
    const res = await request.post("/v2/user/login").send({
      account: `fuser_${TS}`,
      password: "TestPass123",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token.value).toBeDefined();
    expect(res.body.data.token.expirationTime).toBeDefined();
    expect(res.body.data.user.name).toBe(`fuser_${TS}`);
    token = res.body.data.token.value;
  });

  it("应支持通过邮箱登录", async () => {
    const res = await request.post("/v2/user/login").send({
      account: `flow_${TS}@t.com`,
      password: "TestPass123",
    });
    expect(res.status).toBe(200);
  });
});

describe("认证中间件", () => {
  it("裸 token 在 Authorization 头中应通过鉴权", async () => {
    const res = await request
      .get("/v2/user/info")
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(`fuser_${TS}`);
  });

  it("Bearer 前缀应导致 401", async () => {
    const res = await request
      .get("/v2/user/info")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("无 token 应返回 401", async () => {
    const res = await request.get("/v2/user/info");
    expect(res.status).toBe(401);
  });
});

describe("POST /v2/user/logout", () => {
  it("无 token 应返回 400", async () => {
    const res = await request.post("/v2/user/logout").send({});
    expect(res.status).toBe(400);
  });

  it("有效 token 应成功登出", async () => {
    const res = await request
      .post("/v2/user/logout")
      .set("Authorization", token)
      .send({});
    expect(res.status).toBe(200);
  });

  it("登出后 token 应失效", async () => {
    const res = await request
      .get("/v2/user/info")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });
});
