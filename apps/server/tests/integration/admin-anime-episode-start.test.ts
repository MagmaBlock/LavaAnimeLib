import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";
import { db } from "../../common/database/connection.js";
import { inviteCode } from "../../common/database/schema/invite-code.js";
import { updateUserData } from "../../services/v2/user/profile.js";

const request = supertest(app);
const TS = Date.now();

let token: string;
let plainToken: string;
let userID: number;

beforeAll(async () => {
  // 直接插入两条未使用的邀请码, 避免与其它测试文件争用种子中的 TESTCODE001/002 (单次使用)
  const plainCode = `ADM_PLAIN_${TS}`;
  const adminCode = `ADM_ADMIN_${TS}`;
  await db.insert(inviteCode).values([
    { code: plainCode, code_creator: 1, expiration_time: null },
    { code: adminCode, code_creator: 1, expiration_time: null },
  ]);

  // 普通用户 (无 admin 权限)
  await request.post("/v2/user/register").send({
    email: `plain_${TS}@t.com`,
    password: "PlainTest11",
    name: `plain_${TS}`,
    inviteCode: plainCode,
  });
  const plainLogin = await request.post("/v2/user/login").send({
    account: `plain_${TS}`,
    password: "PlainTest11",
  });
  plainToken = plainLogin.body.data.token.value;

  // 待提升为管理员
  await request.post("/v2/user/register").send({
    email: `adm_${TS}@t.com`,
    password: "AdmTest11",
    name: `adm_${TS}`,
    inviteCode: adminCode,
  });
  const loginRes = await request.post("/v2/user/login").send({
    account: `adm_${TS}`,
    password: "AdmTest11",
  });
  token = loginRes.body.data.token.value;
  userID = loginRes.body.data.user.id;

  // 通过 service 接口将该用户提升为管理员 (会清缓存, 下次请求重新加载)
  await updateUserData({ permission: { admin: true } }, userID);
});

describe("GET /v2/admin/anime/episode-start", () => {
  it("未登录应返回 403", async () => {
    const res = await request.get("/v2/admin/anime/episode-start").query({ laID: 1 });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
  });

  it("普通登录用户 (无 admin 权限) 应返回 403", async () => {
    const res = await request
      .get("/v2/admin/anime/episode-start")
      .query({ laID: 1 })
      .set("Authorization", plainToken);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
  });

  it("缺 laID 应返回 400", async () => {
    const res = await request
      .get("/v2/admin/anime/episode-start")
      .set("Authorization", token);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
  });

  it("laID 非数字应返回 400", async () => {
    const res = await request
      .get("/v2/admin/anime/episode-start")
      .query({ laID: "abc" })
      .set("Authorization", token);
    expect(res.status).toBe(400);
  });

  it("不存在的 laID 应返回 404", async () => {
    const res = await request
      .get("/v2/admin/anime/episode-start")
      .query({ laID: 99999 })
      .set("Authorization", token);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
  });

  it("存在 laID 应返回 episode_start 元信息", async () => {
    const res = await request
      .get("/v2/admin/anime/episode-start")
      .query({ laID: 1 })
      .set("Authorization", token);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.name).toBeDefined();
    expect(res.body.data).toHaveProperty("episode_start");
    expect([0, 1]).toContain(res.body.data.episode_start_manual);
  });
});

describe("POST /v2/admin/anime/episode-start", () => {
  it("manual=true 缺 episode_start 应返回 400", async () => {
    const res = await request
      .post("/v2/admin/anime/episode-start")
      .set("Authorization", token)
      .send({ laID: 1, manual: true });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
  });

  it("manual=true 写入后, GET 能读到 manual=1 与对应值", async () => {
    const setRes = await request
      .post("/v2/admin/anime/episode-start")
      .set("Authorization", token)
      .send({ laID: 1, manual: true, episode_start: 13 });
    expect(setRes.status).toBe(200);
    expect(setRes.body.data.episode_start).toBe(13);

    const getRes = await request
      .get("/v2/admin/anime/episode-start")
      .query({ laID: 1 })
      .set("Authorization", token);
    expect(getRes.body.data.episode_start).toBe(13);
    expect(getRes.body.data.episode_start_manual).toBe(1);

    // 还原为 auto, 避免污染后续测试
    await request
      .post("/v2/admin/anime/episode-start")
      .set("Authorization", token)
      .send({ laID: 1, manual: false });
  });

  it("不存在的 laID 应返回 404", async () => {
    const res = await request
      .post("/v2/admin/anime/episode-start")
      .set("Authorization", token)
      .send({ laID: 99999, manual: true, episode_start: 5 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
  });
});