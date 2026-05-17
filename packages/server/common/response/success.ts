import type { Response } from "express";

export default function success(res: Response, data?: unknown, message = "成功") {
  if (!res) throw new Error("No res provide");
  if (data !== undefined) {
    res.status(200).send({ code: 200, message, data });
  } else {
    res.status(200).send({ code: 200, message });
  }
}
