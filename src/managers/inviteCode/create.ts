import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import {
  InviteCodeAlreadyExistError,
  UserNotExistError,
} from "../../error/error";

/**
 * 创建一个邀请码
 * @param code 邀请码内容
 * @param createdById
 * @param expiredAt
 * @returns
 */
export async function inviteCodeCreate(
  code?: string,
  createdById?: number,
  expiredAt?: Date
) {
  try {
    return await usePrisma.inviteCode.create({
      data: {
        code: code ?? generateInviteCode(),
        createdById,
        expiredAt,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new InviteCodeAlreadyExistError();
      }
      if (error.code === "P2003") {
        throw new UserNotExistError();
      }
    }
    throw error;
  }
}

/**
 * 批量创建邀请码
 * @param tryAmount 创建数量
 * @param createdById 创建者
 * @param expiredAt 过期时间
 */
export async function inviteCodeCreateMany(
  tryAmount: number,
  createdById?: number,
  expiredAt?: Date
) {
  let codes = [];
  for (let i = 0; i < tryAmount; i++) {
    codes.push({
      code: generateInviteCode(),
      createdById,
      expiredAt,
    });
  }

  try {
    return await usePrisma.inviteCode.createMany({
      data: codes,
      skipDuplicates: true,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new UserNotExistError();
      }
    }
    throw error;
  }
}

/**
 * 生成随机的邀请码
 */
function generateInviteCode(): string {
  let randomNumer = Math.random();
  let inviteCodeLong = createHash("sha1")
    .update(randomNumer.toString())
    .digest("base64url");
  inviteCodeLong = inviteCodeLong.replace(/[^a-zA-Z0-9]/g, "");
  let inviteCode = inviteCodeLong.slice(0, 12).toLocaleUpperCase();
  return inviteCode;
}
