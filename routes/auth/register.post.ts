import { ClientError } from "../../src/class/error/error";
import { userCreate } from "../../src/managers/user/create";

export default eventHandler(async (event) => {
  let { email, name, password, inviteCode } = await readBody(event);

  try {
    return await userCreate(email, name, password, inviteCode);
  } catch (error) {
    if (error instanceof ClientError) {
      setResponseStatus(event, error.getStatusCode());
      return { message: error.message, cause: error.cause };
    }
    throw error;
  }
});
