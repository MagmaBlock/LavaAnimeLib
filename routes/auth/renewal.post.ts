import { tokenRenewal } from "../../src/managers/token/renewal";

export default eventHandler(async (event) => {
  const { token } = await readBody(event);

  return { token: tokenRenewal(token) };
});
