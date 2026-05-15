import type { Request, Response } from "express";
import { getAnimesByID as getAnimesByIDService } from "../../../services/v2/anime/index.js";
import success from "../../../common/response/success.js";
import serverError from "../../../common/response/server-error.js";

export async function getAnimesByID(req: Request, res: Response) {
  const ids = req.body.ids;
  try {
    const result = await getAnimesByIDService(ids);
    success(res, result);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
