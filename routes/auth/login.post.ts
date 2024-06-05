import { Entrance } from "~/src/class/entrance";

export default eventHandler(async (event) => {
  const { account, password } = await readBody(event);

  const login = await Entrance.getInstance()
    .getUserManager()
    .login(account, password);
  login.user.encryption = undefined;
  login.user.password = undefined;

  return login;
});
