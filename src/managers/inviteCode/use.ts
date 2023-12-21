import { Prisma } from "@prisma/client";
import { InviteCodeNotFoundError, UserNotFoundError } from "../../error/error";

/**
 * 使用一个邀请码
 * @param code
 * @param usedById
 * @returns
 */
export async function inviteCodeUse(code: string, usedById: number) {
  try {
    return await usePrisma.inviteCode.update({
      // 查找没有过期的此邀请码
      where: {
        code: code,
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
      // 更新此邀请码的使用状态
      data: {
        usedById,
        usedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new UserNotFoundError();
      }
      if (error.code === "P2025") {
        throw new InviteCodeNotFoundError();
      }
    }
    throw error;
  }
}
