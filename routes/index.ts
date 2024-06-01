import { Entrance } from "~/src/class/manager";

export default eventHandler(async (event) => {
  const server = new Entrance();

  return {
    name: "LavaAnimeLibServer",
    version: "3.0.0",
  };
});
