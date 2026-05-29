import axios from "axios";
import config from "../env.js";

export const bangumiAPI = axios.create({
  baseURL: config.bangumi.host,
  headers: { "User-Agent": "LavaAnimeLib/2.0" },
  timeout: 10000,
});
