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
  if (!isEmail(email)) throw new UserEmailBadError();
  if (!isVaildName(name)) throw new UserNameBadError();
  if (!isSecurePassword(password)) throw new UserPasswordBadError();

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
          throw new UserEmailConflictError();
        }
        if (error.meta?.target === "User_name_key") {
          throw new UserNameConflictError();
        }
      }
      if (error.code === "P2025") {
        throw new InviteCodeNotFoundError();
      }
    }
    throw error;
  }
}

function isVaildName(name: string) {
  return name?.length > 0 && name?.length <= 30;
}

function isEmail(email: string) {
  return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email);
}

/**
 * 检查字符串是否是一个足够复杂的密码
 * 密码至少包含字母, 且长度为 7-64
 */
function isSecurePassword(password: string): boolean {
  return /^(?=.*[a-zA-Z]).{7,64}$/.test(password);
}
