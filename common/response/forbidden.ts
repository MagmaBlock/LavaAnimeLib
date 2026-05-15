import type { Response } from "express";

export default function forbidden(res: Response, message = "Forbidden 没有相应权限") {
  if (!res) throw new Error("No res provide");
  res.status(403).send({ code: 403, message });
}
