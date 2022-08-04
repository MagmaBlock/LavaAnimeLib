import axios from "axios";
import config from "./config.js";

export const AlistAPI = axios.create({
    baseURL: config.alist.host
})

export const bangumiAPI = axios.create({
    baseURL: config.bangumi.host,
    headers: { 'User-Agent': 'LavaAnimeLib/2.0' }
})

export const qqBotAPI = axios.create({
    baseURL: config.qqBotApi.host
})