import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validateBody, validateQuery } from "../../middleware/validate.js";

function mockReqRes(body: any = {}) {
  const req = { body } as any;
  const res = { status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
  const next = vi.fn();
  return { req, res, next };
}

function mockReqQuery(query: any = {}) {
  const req = { query } as any;
  const res = { status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
  const next = vi.fn();
  return { req, res, next };
}

describe("validateBody", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0),
  });
  const middleware = validateBody(schema);

  it("valid body calls next() and replaces req.body", () => {
    const { req, res, next } = mockReqRes({ name: "foo", age: 25 });
    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "foo", age: 25 });
  });

  it("invalid body returns 400", () => {
    const { req, res, next } = mockReqRes({ name: "", age: -1 });
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 400 }));
  });

  it("missing required field returns 400 with field path in message", () => {
    const { req, res, next } = mockReqRes({ name: "foo" });
    middleware(req, res, next);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("age") }),
    );
  });

  it("custom error message from schema is passed through", () => {
    const schemaWithMsg = z.object({
      value: z.string().min(1, "must not be empty"),
    });
    const mw = validateBody(schemaWithMsg);
    const { req, res, next } = mockReqRes({ value: "" });
    mw(req, res, next);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("must not be empty") }),
    );
  });

  it("superRefine returns 400 with custom message", () => {
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
    const mw = validateBody(refineSchema);
    const { req, res, next } = mockReqRes({ currentTime: 100, totalTime: 50 });
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("currentTime must not exceed totalTime"),
      }),
    );
  });
});

describe("validateQuery", () => {
  const schema = z.object({
    id: z.coerce.number().int().positive(),
    full: z.coerce.boolean().optional(),
  });
  const middleware = validateQuery(schema);

  it("coerces string query params to number/boolean", () => {
    const { req, res, next } = mockReqQuery({ id: "123", full: "true" });
    middleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.query).toEqual({ id: 123, full: true });
  });

  it("invalid query returns 400", () => {
    const { req, res, next } = mockReqQuery({ id: "-1" });
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("missing required field returns 400", () => {
    const { req, res, next } = mockReqQuery({});
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("applies default values from schema", () => {
    const schemaWithDefault = z.object({
      skip: z.coerce.number().int().min(0).default(0),
      take: z.coerce.number().int().min(0).default(20),
    });
    const mw = validateQuery(schemaWithDefault);
    const { req, res, next } = mockReqQuery({});
    mw(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.query).toEqual({ skip: 0, take: 20 });
  });
});
