import success from "../../../../common/response/success.js";
import forbidden from "../../../../common/response/forbidden.js";
import unauthorized from "../../../../common/response/unauthorized.js";
import {
  generateInviteCode,
  saveInviteCode,
} from "../../../../services/v2/user/invite-code.js";

export async function createUserInviteCode(req, res) {
  if (!req.user) {
    return unauthorized(res);
  }
  if (req.user.data?.permission?.admin) {
    let { amount, expirationTime } = req.body;
    let inviteCodes = [];

    if (!amount) amount = 1;
    if (!expirationTime) expirationTime = null;

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

    success(res, inviteCodes);
  } else {
    return forbidden(res);
  }
}
