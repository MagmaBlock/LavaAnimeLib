import { Prisma } from "@prisma/client";
import { BadRequestError } from "../../class/error/error";

/**
 * 创建一个动画.
 * @param name
 * @param originalName
 * @param summary
 * @param date
 * @param platform
 * @param nsfw
 * @param bdrip
 * @deprecated
 */
export async function animeCreate(
  name: string,
  originalName?: string,
  summary?: string,
  date?: string,
  platform?: string,
  nsfw?: boolean,
  bdrip?: boolean
) {
  if (!name) throw new BadRequestError("缺失名称字段");

  try {
    const create = await usePrisma.anime.create({
      data: {
        name,
        originalName,
        summary,
        date,
        platform,
        nsfw,
        bdrip,
      },
    });

    return create;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // TODO
    }
    throw error;
  }
}
