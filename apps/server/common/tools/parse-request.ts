import type { z } from "zod";
import type { Request, Response } from "express";
import badRequest from "../response/bad-request.js";

function formatIssues(error: z.ZodError) {
  return error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
}

export function parseQuery<T extends z.ZodType>(
  schema: T,
  req: Request,
  res: Response,
): z.output<T> | undefined {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    badRequest(res, formatIssues(result.error));
    return undefined;
  }
  return result.data;
}

export function parseBody<T extends z.ZodType>(
  schema: T,
  req: Request,
  res: Response,
): z.output<T> | undefined {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    badRequest(res, formatIssues(result.error));
    return undefined;
  }
  return result.data;
}
