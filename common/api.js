import axios from "axios";
import config from "./config.js";
import { getDefaultDrive, getDrive } from "../controllers/v2/drive/main.js";

export const AlistAPI = axios.create({
  baseURL: getDrive(getDefaultDrive()).host,
});

export const bangumiAPI = axios.create({
  baseURL: config.bangumi.host,
  headers: { "User-Agent": "LavaAnimeLib/2.0" },
  timeout: 10000,
});

export const qqBotAPI = axios.create({
  baseURL: config.qqBotApi.host,
});
