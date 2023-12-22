import {
  ClientError,
  UserNotFoundError,
  UserPasswordError,
} from "../../src/class/error/error";
import { userLogin } from "../../src/managers/user/login";

export default eventHandler(async (event) => {
  const { account, password } = await readBody(event);

  try {
    const login = await userLogin(account, password);

    login.user.encryption = undefined;
    login.user.password = undefined;

    return login;
  } catch (error) {
    if (error instanceof ClientError) {
      setResponseStatus(event, error.getStatusCode());
    }
    if (error instanceof UserNotFoundError) {
      return { message: "无法找到此用户" };
    }
    if (error instanceof UserPasswordError) {
      return { message: "密码错误" };
    }
    throw error;
  }
});
