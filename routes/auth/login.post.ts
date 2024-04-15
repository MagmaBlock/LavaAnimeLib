import { UserManager } from "~/src/class/user/manager";

export default eventHandler(async (event) => {
  const { account, password } = await readBody(event);

  const login = await UserManager.login(account, password);
  login.user.encryption = undefined;
  login.user.password = undefined;

  return login;
});
