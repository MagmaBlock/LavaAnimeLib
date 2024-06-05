import { Entrance } from "~/src/class/entrance";

export default eventHandler(async (event) => {
  const { token } = await readBody(event);

  return { token: Entrance.getInstance().getTokenManager().tokenRenewal(token) };
});
