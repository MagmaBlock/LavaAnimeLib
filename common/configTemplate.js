export default {
    mysql: {
        host: "localhost",
        port: 3306,
        user: "LavaAnime",
        database: "lavaanime",
        password: "password",
    },
    // AList 存储策略，提供统一资源管理 API 和资源直链功能
    alist: {
        host: "https://alist.com",
        password: "password",
        root: "/1A/LavaAnimeLib"
    },
    // Bangumi API 域名，用于抓取 Bangumi 番组计划的番剧资料
    bangumi: {
        host: "https://bgm-api.5t5.top"
    },
    // Bangumi Image 地址
    bangumiImage: {
        host: "https://anime-img.5t5.top"
    },
    // CQ-HTTP QQ Bot API 域名和消息群号
    qqBotApi: {
        host: "https://bot.api.com",
        group: {
            // 群号
            "main": 0, "dev": 0
        },
        usedGroup: ['main']
    },
    // 缓存天数，管理 Bangumi Data 数据会被缓存多少天后刷新
    cache: 1,
    // 是否信任上层代理，开启后，程序获取到的 IP 将会是由上层代理 (如 nginx) 在 HTTP Header 中提供的客户端 IP
    // 若未经任何程序代理，请不要启用此选项，否则客户端将可伪造 IP 地址
    trustProxy: true,
}