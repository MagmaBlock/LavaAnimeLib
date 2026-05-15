import type { Request, Response, NextFunction } from "express";

export default function configHeaders(req: Request, res: Response, next: NextFunction) {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
    "Access-Control-Max-Age": "3600",
  });
  if (req.method === "OPTIONS") return res.status(200).end();

  next();
}
