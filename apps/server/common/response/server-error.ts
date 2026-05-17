import type { Response } from "express";

export default function serverError(res: Response, message = "Internal Server Error 服务器内部错误") {
  if (!res) throw new Error("No res provide");
  res.status(500).send({ code: 500, message });
}
