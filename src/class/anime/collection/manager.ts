import { AnimeCollectionStatus } from "@prisma/client";

/**
 * 管理用户的动画追番
 */
export class AnimeCollectionManager {
  async createOrUpdate(
    userId: number,
    animeId: number,
    status: AnimeCollectionStatus
  ) {
    const result = await usePrisma.animeCollection.upsert({
      create: {
        userId,
        animeId,
        status,
      },
      update: {
        status,
      },
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
    });

    return result;
  }

  async remove(userId: number, animeId: number) {
    const result = await usePrisma.animeCollection.delete({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
    });

    return result;
  }

  async get(userId: number, animeId: number) {
    const result = await usePrisma.animeCollection.findUnique({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
    });

    return result;
  }

  async getAllWithUser(userId: number) {
    const result = await usePrisma.animeCollection.findMany({
      where: {
        userId,
      },
      include: {
        anime: true,
      },
    });

    return result;
  }

  async getAllWithAnime(animeId: number) {
    const result = await usePrisma.animeCollection.findMany({
      where: {
        animeId,
      },
      include: {
        user: true,
      },
    });

    return result;
  }
}
