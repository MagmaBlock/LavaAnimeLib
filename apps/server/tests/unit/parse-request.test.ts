import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { parseBody, parseQuery } from "../../common/tools/parse-request.js";

function mockReqRes(body: unknown = {}, query: unknown = {}) {
  const req = {
    body: body as Record<string, unknown>,
    query: query as Record<string, unknown>,
  } as Parameters<typeof parseBody>[1] & Parameters<typeof parseQuery>[1];
  const res = { status: vi.fn().mockReturnThis(), send: vi.fn() } as unknown as Parameters<typeof parseBody>[2];
  return { req, res };
}

describe("parseBody", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0),
  });

  it("有效 body 应返回解析后的数据", () => {
    const { req, res } = mockReqRes({ name: "foo", age: 25 });
    const result = parseBody(schema, req, res);
    expect(result).toEqual({ name: "foo", age: 25 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("无效 body 应调用 badRequest 并返回 undefined", () => {
    const { req, res } = mockReqRes({ name: "", age: -1 });
    const result = parseBody(schema, req, res);
    expect(result).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 400 }));
  });

  it("缺少必填字段应返回 400 并包含字段路径", () => {
    const { req, res } = mockReqRes({ name: "foo" });
    const result = parseBody(schema, req, res);
    expect(result).toBeUndefined();
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("age") }),
    );
  });

  it("自定义 error message 应透传", () => {
    const schemaWithMsg = z.object({
      value: z.string().min(1, "must not be empty"),
    });
    const { req, res } = mockReqRes({ value: "" });
    const result = parseBody(schemaWithMsg, req, res);
    expect(result).toBeUndefined();
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("must not be empty") }),
    );
  });

  it("superRefine 校验失败应返回 400", () => {
    const refineSchema = z
      .object({
        currentTime: z.number().min(0),
        totalTime: z.number().min(0),
      })
      .superRefine((data, ctx) => {
        if (data.currentTime > data.totalTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["currentTime"],
            message: "currentTime must not exceed totalTime",
          });
        }
      });
    const { req, res } = mockReqRes({ currentTime: 100, totalTime: 50 });
    const result = parseBody(refineSchema, req, res);
    expect(result).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("currentTime must not exceed totalTime"),
      }),
    );
  });
});

describe("parseQuery", () => {
  const schema = z.object({
    id: z.coerce.number().int().positive(),
    full: z.coerce.boolean().optional(),
  });

  it("coerce 字符串查询参数为 number/boolean", () => {
    const { req, res } = mockReqRes(undefined, { id: "123", full: "true" });
    const result = parseQuery(schema, req, res);
    expect(result).toEqual({ id: 123, full: true });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("无效 query 应返回 400", () => {
    const { req, res } = mockReqRes(undefined, { id: "-1" });
    const result = parseQuery(schema, req, res);
    expect(result).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("缺少必填字段应返回 400", () => {
    const { req, res } = mockReqRes(undefined, {});
    const result = parseQuery(schema, req, res);
    expect(result).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("应使用 schema 的默认值", () => {
    const schemaWithDefault = z.object({
      skip: z.coerce.number().int().min(0).default(0),
      take: z.coerce.number().int().min(0).default(20),
    });
    const { req, res } = mockReqRes(undefined, {});
    const result = parseQuery(schemaWithDefault, req, res);
    expect(result).toEqual({ skip: 0, take: 20 });
  });
});
