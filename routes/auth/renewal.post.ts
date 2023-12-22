import { ClientError, UnauthorizedError } from "../../src/class/error/error";
import { tokenRenewal } from "../../src/managers/token/renewal";

export default eventHandler(async (event) => {
  const { token } = await readBody(event);

  try {
    return tokenRenewal(token);
  } catch (error) {
    if (error instanceof ClientError) {
      setResponseStatus(event, error.getStatusCode());
      return { message: error.message };
    }
  }
});
