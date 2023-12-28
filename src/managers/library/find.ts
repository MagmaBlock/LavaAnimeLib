import { NotFoundError } from "../../class/error/error";

/**
 * 查找一个库
 * @param params
 */
export async function libraryFind(id: string) {
  const find = await usePrisma.library.findUnique({
    where: {
      id,
    },
  });

  if (find === null) throw new NotFoundError("找不到此资源库");
  return find;
}
