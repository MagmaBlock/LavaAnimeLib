import type { Response } from "express";

export default function badRequest(res: Response, message = "Bad Request 请求格式错误") {
  if (!res) throw new Error("No res provide");
  res.status(400);
  res.send({ code: 400, message });
}
