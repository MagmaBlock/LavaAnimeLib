import { animeCreate } from "../../../src/managers/anime/create";

export default defineEventHandler(async (event) => {
  await readAdmin(event);
  const { name, originalName, summary, date, platform, nsfw, bdrip } =
    await readBody(event);

  return await animeCreate(
    name,
    originalName,
    summary,
    date,
    platform,
    nsfw,
    bdrip
  );
});
