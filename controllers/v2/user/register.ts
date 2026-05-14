import success from "../../../common/response/success.js";
import badRequest from "../../../common/response/bad-request.js";
import serverError from "../../../common/response/server-error.js";
import { testInviteCode, useInviteCode } from "../../../services/v2/user/invite-code.js";
import { getFormattedPassword, isSecurePassword } from "../../../services/v2/user/password.js";
import { checkEmailExists, checkNameExists, createUser, getNextUserID } from "../../../services/v2/user/user.js";

const regExpDict = {
  email: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
};

export async function userRegister(req, res) {
  let { email, password, name, inviteCode } = req.body;

  try {
    if (!email || !password || !name || !inviteCode) {
      return badRequest(res, "请求语法错误");
    }

    if (!regExpDict.email.test(email)) {
      return badRequest(res, "邮箱不合法");
    }

    if (await checkEmailExists(email)) {
      return badRequest(res, "该邮箱已被注册");
    }

    if (!isSecurePassword(password)) {
      return badRequest(res, "密码不合法, 密码至少包含字母, 且长度为7-64");
    }

    if (await checkNameExists(name)) {
      return badRequest(res, "昵称已存在，请更换一个");
    }
    if (name.length > 30 || name.length == 0) {
      return badRequest(res, "昵称长度太长或为空");
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
      serverError(res, "服务器错误，注册失败");
    }
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
}
