import { Entrance } from "~/src/class/entrance";
import { LibFileEpLinker } from "~/src/class/library/file/episode";
import nodePath from "path/posix";

export default eventHandler(async (event) => {
  const server = new Entrance();

  return {
    name: "LavaAnimeLibServer",
    version: "3.0.0",
  };
});
