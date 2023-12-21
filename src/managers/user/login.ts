import { Sha256Password } from "../../class/password/sha256";
import { UserNotFoundError, UserPasswordError } from "../../error/error";

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
    if (user === null) throw new UserNotFoundError();

    if (user.encryption === "Sha256") {
      let hashedPassword = new Sha256Password();
      hashedPassword.parse(user.password);
      if (hashedPassword.testPassword(password)) {
        return useAuth.sign(<TokenPayload>{
          id: user.id,
        });
      } else {
        throw new UserPasswordError();
      }
    }

    return null;
  } catch (error) {
    throw error;
  }
}
