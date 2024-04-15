import { UserManager } from "~/src/class/user/manager";
import { BadRequestError } from "../../src/class/error/error";
import { assertUser } from "../../utils/auth";

export default eventHandler(async (event) => {
  const user = await assertUser(event);
  const { newPassword } = await readBody(event);

  if (!newPassword) throw new BadRequestError("密码不能为空");
  await UserManager.changePassword(user.id, newPassword);
  return { message: "修改成功" };
});
