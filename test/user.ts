import { AnimeCollectionStatus } from "@prisma/client";
import { AnimeCollectionManager } from "~/src/class/anime/collection/manager";
import { InviteCodeManager } from "~/src/class/invite-code/manager";
import { UserManager } from "~/src/class/user/manager";

export async function main() {
  //   const code = await InviteCodeManager.create();
  //   const user = await UserManager.register(
  //     "magmablock@qq.com",
  //     "Magma",
  //     "lmy030405",
  //     code.code
  //   );

  const user = await usePrisma.user.findUnique({ where: { id: 1 } });
  const anime = await usePrisma.anime.findFirst();
  await AnimeCollectionManager.createOrUpdate(
    user.id,
    anime.id,
    AnimeCollectionStatus.Watching
  );

  const collections = await AnimeCollectionManager.getAllWithUser(user.id);
  logger.info(collections);
}
