import { LibraryType, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ConflictError } from "../../class/error/error";

/**
 * 创建一个库
 * @param id
 * @param name
 * @param description
 * @param type
 * @param noNSFW
 * @param noDownload
 */
export async function libraryCreate(
  id: string,
  name: string,
  description?: string,
  type?: LibraryType,
  noNSFW?: boolean,
  noDownload?: boolean
) {
  try {
    const create = await usePrisma.library.create({
      data: {
        id,
        name,
        description,
        type,
        noNSFW,
        noDownload,
      },
    });

    return create;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictError("库 ID 重复");
      }
    }
    throw error;
  }
}
