import { Prisma } from "@prisma/client";
import { Sha256Password } from "../../class/password/sha256";
import {
  UserNotFoundError,
  UserPasswordBadError,
} from "../../class/error/error";
import { UserValidator } from "./validator/user";

export async function userChangePassword(userId: number, newPassword: string) {
  if (UserValidator.isSecurePassword(newPassword) === false) {
    throw new UserPasswordBadError("密码至少包含字母, 且长度为 7-64");
  }

  const passwordObject = new Sha256Password();
  passwordObject.setSalt(passwordObject.generateNewSalt(), newPassword);

  try {
    await usePrisma.user.update({
      where: {
        id: userId,
      },
      data: {
        encryption: "Sha256",
        password: passwordObject.stringify(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new UserNotFoundError("找不到用户");
      }
    }
  }
}
