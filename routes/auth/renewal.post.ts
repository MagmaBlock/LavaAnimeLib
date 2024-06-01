import { Entrance } from "~/src/class/manager";

export default eventHandler(async (event) => {
  const { token } = await readBody(event);

  return { token: Entrance.getInstance().getTokenManager().tokenRenewal(token) };
});
