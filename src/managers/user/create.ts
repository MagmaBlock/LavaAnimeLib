import { Prisma } from "@prisma/client";
import {
  InviteCodeNotFoundError,
  UserEmailConflictError,
  UserEmailBadError,
  UserNameConflictError,
  UserNameBadError,
  UserPasswordBadError,
} from "../../class/error/error";
import { Sha256Password } from "../../class/password/sha256";
import { UserValidator } from "./validator/user";
/**
 * 创建新用户
 * @param email
 * @param name
 * @param password
 * @param inviteCode
 * @returns 创建完成的 User Prisma 对象
 */
export async function userCreate(
  email: string,
  name: string,
  password: string,
  inviteCode: string
) {
  if (!UserValidator.isEmail(email)) throw new UserEmailBadError("邮箱不合法");
  if (!UserValidator.isVaildName(name))
    throw new UserNameBadError("用户名不能为空或过长");
  if (!UserValidator.isSecurePassword(password))
    throw new UserPasswordBadError("密码至少包含字母, 且长度为 7-64");
  if (!inviteCode) throw new InviteCodeNotFoundError("邀请码不存在");

  const passwordObject = new Sha256Password();
  passwordObject.setSalt(passwordObject.generateNewSalt(), password);

  try {
    const create = await usePrisma.user.create({
      data: {
        email,
        name,
        password: passwordObject.stringify(),
        inviteBy: {
          connect: {
            code: inviteCode,
            usedBy: null,
            OR: [
              {
                expiredAt: {
                  gt: new Date(),
                },
              },
              {
                expiredAt: null,
              },
            ],
          },
        },
      },
      include: {
        inviteBy: true,
      },
    });

    return create;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        if (error.meta?.target === "User_email_key") {
          throw new UserEmailConflictError("邮箱已被注册");
        }
        if (error.meta?.target === "User_name_key") {
          throw new UserNameConflictError("用户名已被使用");
        }
      }
      if (error.code === "P2025") {
        throw new InviteCodeNotFoundError("邀请码无效");
      }
    }
    throw error;
  }
}
