import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import badRequest from "../common/response/bad-request.js";

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return badRequest(res, message);
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return badRequest(res, message);
    }
    req.query = result.data as any;
    next();
  };
}
