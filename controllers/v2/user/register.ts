import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { testInviteCode, useInviteCode } from "../../../services/v2/user/invite-code.js";
import { getFormattedPassword } from "../../../services/v2/user/password.js";
import { checkEmailExists, checkNameExists, createUser, getNextUserID } from "../../../services/v2/user/user.js";

export async function userRegister(req, res) {
  let { email, password, name, inviteCode } = req.body;

  try {
    if (await checkEmailExists(email)) {
      return badRequest(res, "该邮箱已被注册");
    }

    if (await checkNameExists(name)) {
      return badRequest(res, "昵称已存在，请更换一个");
    }

    let inviteCodeStatus = await testInviteCode(inviteCode);
    if (
      inviteCodeStatus.real &&
      !inviteCodeStatus.used &&
      !inviteCodeStatus.expired
    ) {
      let nextUserID = await getNextUserID();
      await useInviteCode(inviteCode, nextUserID);
    } else {
      return badRequest(res, "邀请码不可用");
    }

    let saltyPassword = getFormattedPassword(password);
    let successCreate = await createUser(email, saltyPassword, name);
    if (successCreate) {
      success(res, undefined, "注册成功");
    } else {
      return serverError(res, "服务器错误，注册失败");
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
