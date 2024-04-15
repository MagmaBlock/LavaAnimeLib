import { UserManager } from "~/src/class/user/manager";

export default eventHandler(async (event) => {
  let { email, name, password, inviteCode } = await readBody(event);

  const register = await UserManager.register(
    email,
    name,
    password,
    inviteCode
  );
  register.encryption = undefined;
  register.password = undefined;

  const token = useAuth.sign({
    id: register.id,
  });

  return { token, user: register };
});
