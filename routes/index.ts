import moment from "moment";
import { AnimeInfoAutoUpdater } from "~/src/class/anime/info/updater/autoUpdater/autoUpdater";
import { BangumiAnimeInfoUpdater } from "~/src/class/anime/info/updater/bangumi";

export default eventHandler(async (event) => {
  const updater = new AnimeInfoAutoUpdater();
  await updater.autoUpdateAll(moment().subtract("1", "hours").toDate());

  // await new BangumiAnimeInfoUpdater().updateRelationAnimes("376739");

  return {
    name: "LavaAnimeLibServer",
    version: "3.0.0",
  };
});
