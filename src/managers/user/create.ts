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
  if (!UserValidator.isEmail(email)) throw new UserEmailBadError();
  if (!UserValidator.isVaildName(name)) throw new UserNameBadError();
  if (!UserValidator.isSecurePassword(password))
    throw new UserPasswordBadError();

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
