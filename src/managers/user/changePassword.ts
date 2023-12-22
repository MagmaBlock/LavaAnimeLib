import { Prisma } from "@prisma/client";
import { Sha256Password } from "../../class/password/sha256";
import { UserNotFoundError } from "../../class/error/error";

export async function userChangePassword(userId: number, newPassword: string) {
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
        throw new UserNotFoundError();
      }
    }
  }
}
