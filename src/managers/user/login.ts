import { Sha256Password } from "../../class/password/sha256";
import {
  InternalServerError,
  UserNotFoundError,
  UserPasswordError,
} from "../../class/error/error";
import { User } from "@prisma/client";

/**
 * 用户登入
 * @param account 邮箱或用户名
 * @param password 明文密码
 * @returns 返回一个 JWT Token
 */
export async function userLogin(account: string, password: string) {
  try {
    let user = await usePrisma.user.findFirst({
      where: {
        OR: [{ email: account }, { name: account }],
      },
    });
    if (user === null) throw new UserNotFoundError("无法找到此用户");

    if (user.encryption === "Sha256") {
      let hashedPassword = new Sha256Password();
      hashedPassword.parse(user.password);
      if (hashedPassword.testPassword(password)) {
        return <LoginSuccessResult>{
          token: useAuth.sign(<TokenPayload>{
            id: user.id,
          }),
          user,
        };
      } else {
        throw new UserPasswordError("密码错误");
      }
    }

    throw new InternalServerError("user.encryption 不支持");
  } catch (error) {
    throw error;
  }
}

type LoginSuccessResult = {
  token: string;
  user: User;
};
