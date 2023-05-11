// POST

import success from "../../response/2xx/success.js";
import wrongQuery from "../../response/4xx/wrongQuery.js";
import serverError from "../../response/5xx/serverError.js";
import { updateUserData } from "./updateUser.js";

// 修改当前用户的头像
export async function updateAvatarAPI(req, res) {
  // 校验 URL 合法
  let { url } = req.body;
  if (!url) return wrongQuery(res);
  try {
    url = new URL(url);
  } catch (error) {
    return wrongQuery(res, "无法识别, 请检查 URL 是否合法");
  }

  let newUserData;
  if (req.user.data == null) newUserData = {};
  else newUserData = req.user.data;

  newUserData.avatar = {
    url: url.href,
  };

  try {
    await updateUserData(newUserData, req.user.id);
  } catch (error) {
    serverError(res);
  }
  success(res);
}
