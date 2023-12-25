import { userLogin } from "../../src/managers/user/login";

export default eventHandler(async (event) => {
  const { account, password } = await readBody(event);

  const login = await userLogin(account, password);
  login.user.encryption = undefined;
  login.user.password = undefined;

  return login;
});
