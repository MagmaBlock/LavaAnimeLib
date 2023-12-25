import { BadRequestError } from "../../src/class/error/error";
import { userChangePassword } from "../../src/managers/user/changePassword";
import { readUser } from "../../utils/auth";

export default eventHandler(async (event) => {
  const user = await readUser(event);
  const { newPassword } = await readBody(event);

  if (!newPassword) throw new BadRequestError("密码不能为空");
  await userChangePassword(user.id, newPassword);
  return { message: "修改成功" };
});
