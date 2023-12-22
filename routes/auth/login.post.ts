import { ClientError } from "../../src/class/error/error";
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
      return { message: error.message };
    }
    throw error;
  }
});
