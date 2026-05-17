import type { Response } from "express";

export default function unauthorized(res: Response, message = "Unauthorized 身份验证失败") {
  if (!res) throw new Error("No res provide");
  res.status(401).send({ code: 401, message });
}
