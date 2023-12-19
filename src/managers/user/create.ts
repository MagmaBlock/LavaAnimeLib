import { Prisma } from "@prisma/client";
import {
  InviteCodeInvalidError,
  UserEmailAlreadyExistError,
  UserEmailInvalidError,
  UserNameAlreadyExistError,
  UserNameInvalidError,
  UserPasswordNotSecureError,
} from "../../error/error";

export async function userCreate(
  email: string,
  name: string,
  password: string,
  inviteCode: string
) {
  if (!isEmail(email)) throw new UserEmailInvalidError();
  if (!isVaildName(name)) throw new UserNameInvalidError();
  if (!isSecurePassword(password)) throw new UserPasswordNotSecureError();

  try {
    const create = await usePrisma.user.create({
      data: {
        email,
        name,
        password,
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
          throw new UserEmailAlreadyExistError();
        }
        if (error.meta?.target === "User_name_key") {
          throw new UserNameAlreadyExistError();
        }
      }
      if (error.code === "P2025") {
        throw new InviteCodeInvalidError();
      }
    }
    throw error;
  }
}

function isVaildName(name: string) {
  return name.length > 0 && name.length <= 30;
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
