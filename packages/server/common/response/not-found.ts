import type { Response } from "express";

export default function notFound(res: Response, message = "Not Found 找不到资源") {
  if (!res) throw new Error("No res provide");
  res.status(404).send({ code: 404, message });
}
