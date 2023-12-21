import {
  ClientError,
  InviteCodeNotFoundError,
  UserEmailBadError,
  UserEmailConflictError,
  UserNameBadError,
  UserNameConflictError,
  UserPasswordBadError,
} from "../../src/error/error";
import { userCreate } from "../../src/managers/user/create";

export default eventHandler(async (event) => {
  let { email, name, password, inviteCode } = await readBody(event);

  try {
    return await userCreate(email, name, password, inviteCode);
  } catch (error) {
    if (error instanceof ClientError) {
      setResponseStatus(event, error.getStatusCode());
    }
    if (error instanceof UserEmailBadError) {
      return { message: "邮箱不合法" };
    }
    if (error instanceof UserEmailConflictError) {
      return { message: "邮箱已被注册" };
    }
    if (error instanceof UserNameBadError) {
      return { message: "用户名不能为空或过长" };
    }
    if (error instanceof UserNameConflictError) {
      return { message: "用户名已被使用" };
    }
    if (error instanceof UserPasswordBadError) {
      return { message: "密码至少包含字母, 且长度为 7-64" };
    }
    if (error instanceof InviteCodeNotFoundError) {
      return { message: "邀请码无效" };
    }
    throw error;
  }
});
