import { TokenManager } from "~/src/class/token/manager";

export default eventHandler(async (event) => {
  const { token } = await readBody(event);

  return { token: TokenManager.renewal(token) };
});
