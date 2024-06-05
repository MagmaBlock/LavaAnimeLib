import { BadRequestError } from "../../src/class/error/error";
import { assertUser } from "../../utils/auth";
import { Entrance } from "~/src/class/entrance";

export default eventHandler(async (event) => {
  const user = await assertUser(event);
  const { newPassword } = await readBody(event);

  if (!newPassword) throw new BadRequestError("密码不能为空");
  await Entrance.getInstance()
    .getUserManager()
    .changePassword(user.id, newPassword);
  return { message: "修改成功" };
});
