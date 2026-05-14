import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import {
  generateInviteCode,
  saveInviteCode,
} from "../../../../services/v2/user/invite-code.js";

export async function createUserInviteCode(req, res) {
  if (!req.user.data?.permission?.admin) {
    return forbidden(res);
  }

  let { amount, expirationTime } = req.body;
  let inviteCodes = [];

  for (let i = 0; i < amount; i++) {
    inviteCodes.push({
      code: generateInviteCode(),
      expirationTime: expirationTime ? new Date(expirationTime) : undefined,
    });
  }

  for (let code of inviteCodes) {
    try {
      await saveInviteCode(code.code, req.user.id, code.expirationTime);
    } catch (error) {
      console.error(error);
      inviteCodes = inviteCodes.filter((ele) => {
        return ele.code != code.code;
      });
    }
  }

  return success(res, inviteCodes);
}
