export default defineEventHandler(async (event) => {
  await assertAdmin(event);
  const { name, originalName, summary, date, platform, nsfw, bdrip } =
    await readBody(event);
});
