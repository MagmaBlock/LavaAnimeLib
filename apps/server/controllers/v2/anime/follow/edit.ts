import type { Request, Response } from "express";
import type { User } from "../../../../types/models.js";
import { parseBody } from "../../../../common/tools/parse-request.js";
import { editAnimeFollowBodySchema } from "../../../../schemas/v2/anime/follow/edit.js";
import { editAnimeFollow as editAnimeFollowService } from "../../../../services/v2/anime/follow.js";
import success from "../../../../common/response/success.js";
import badRequest from "../../../../common/response/bad-request.js";
import serverError from "../../../../common/response/server-error.js";
import { log } from "../../../../common/tools/logger.js";

export async function editAnimeFollow(req: Request, res: Response): Promise<void> {
  const user = req.user as User;
  const body = parseBody(editAnimeFollowBodySchema, req, res);
  if (!body) return;
  const { id: laID, status, remove } = body;

  try {
    const result = await editAnimeFollowService(user.id, laID, status, remove);
    if (result === null) {
      return badRequest(res, "请求了修改追番 API 但什么也没修改, 请检查参数是否正确");
    }
    return success(res, undefined);
  } catch (error) {
    log.error(error);
    return serverError(res);
  }
}
