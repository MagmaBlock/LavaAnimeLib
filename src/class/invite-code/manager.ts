import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import {
  InviteCodeConflictError,
  InviteCodeNotFoundError,
  UserNotFoundError,
} from "../error/error";

export class InviteCodeManager {
  /**
   * 创建一个邀请码
   * @param code 邀请码内容
   * @param createdById 邀请码创建者
   * @param expiredAt 过期时间
   * @returns
   */
  async create(code?: string, createdById?: number, expiredAt?: Date) {
    try {
      return await usePrisma.inviteCode.create({
        data: {
          code: code ?? this.getRandomInviteCode(),
          createdById,
          expiredAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new InviteCodeConflictError();
        }
        if (error.code === "P2003") {
          throw new UserNotFoundError();
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
  async createMany(tryAmount: number, createdById?: number, expiredAt?: Date) {
    let codes = [];
    for (let i = 0; i < tryAmount; i++) {
      codes.push({
        code: this.getRandomInviteCode(),
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
          throw new UserNotFoundError();
        }
      }
      throw error;
    }
  }

  /**
   * 生成随机的邀请码
   */
  getRandomInviteCode() {
    let randomNumer = Math.random();
    let inviteCodeLong = createHash("sha1")
      .update(randomNumer.toString())
      .digest("base64url");
    inviteCodeLong = inviteCodeLong.replace(/[^a-zA-Z0-9]/g, "");
    let inviteCode = inviteCodeLong.slice(0, 12).toLocaleUpperCase();
    return inviteCode;
  }

  /**
   * 删除邀请码
   * @param code
   * @param createdById 筛选创建者
   * @param expiredLt 筛选过期时间早于...
   */
  async remove(code?: string, createdById?: number, expiredLt?: Date) {
    try {
      return await usePrisma.inviteCode.deleteMany({
        where: {
          code: code ?? undefined,
          createdById: createdById ?? undefined,
          expiredAt: expiredLt instanceof Date ? { lt: expiredLt } : undefined,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 测试一个邀请码是否可用
   * @param code
   * @returns
   */
  async test(code: string) {
    try {
      const find = await usePrisma.inviteCode.findFirst({
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
      });
      if (find === null) return false;
      else return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 使用一个邀请码
   * @param code
   * @param usedById
   * @returns
   */
  async use(code: string, usedById: number) {
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
}
