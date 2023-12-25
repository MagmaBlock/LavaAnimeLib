import { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const user = await readAdmin(event);
  const { name, originalName, summary, date, platform, nsfw, bdrip } =
    await readBody(event);

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
});
