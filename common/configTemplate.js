export default {
  // MySQL 相关配置
  mysql: {
    host: "localhost",
    port: 3306,
    user: "LavaAnime",
    database: "lavaanime",
    password: "password",
  },
  // Alist 存储节点相关配置
  // 用于番剧库的视频播放和刷新
  drive: {
    default: "1A",
    list: [
      {
        id: "1A",
        name: "存储节点名称",
        description: "这是存储节点的简介",
        banNSFW: false,
        type: "alist",
        host: "https://alist.com",
        path: "/1A/LavaAnimeLib",
        password: "",
      },
    ],
  },
  // Bangumi API 域名
  // 用于抓取 Bangumi 番组计划的番剧资料
  bangumi: {
    host: "https://api.bgm.tv",
  },
  // Bangumi 的封面图域名
  // 用于前端展示 Bangumi 番剧的封面
  bangumiImage: {
    host: "https://lain.bgm.tv/",
  },
  // Mirai 相关配置
  // 用于发送 QQ 消息提示 (新番入库)
  mirai: {
    baseConfig: {
      qqID: 1234568789,
      target: {
        group: [123456789],
        friend: [],
      },
      enableVerify: true,
      verifyKey: "ThisIsYourMiraiVerifyKey",
    },
    adapterSettings: {
      http: {
        baseURL: "https://url-access-your-mirai-api.com",
      },
    },
  },
  // 缓存天数，管理 Bangumi Data 数据会被缓存多少天后刷新
  cache: 3,
  security: {
    // 是否信任上层代理，开启后，程序获取到的 IP 将会是由上层代理 (如 nginx) 在 HTTP Header 中提供的客户端 IP
    // 若未经任何程序代理，请不要启用此选项，否则客户端将可伪造 IP 地址
    trustProxy: true,
    // 是否使用 Referer 限制. 开启后，程序将根据请求中的 Referer 进行判断
    enableRefererWhiteList: false,
    // 需要下方的内容能对客户端的 Referer 匹配到结果, 若不在此列表，将回复 403.
    // 留空不启用, 支持字符串和正则表达式
    refererWhiteList: [
      "https://lavani.me/",
      /http(s){0,1}:\/\/localhost(:\d{4,5}|){0,1}/gi, // 本机
      /http(s){0,1}:\/\/127\.0\.0\.1(:\d{4,5}|){0,1}/gi, // 本机
      /http(s){0,1}:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d{4,5}|){0,1}/gi, // 普通数字内网
    ],
    // 是否允许空 Referer
    allowEmptyReferer: true,
    // 登录后获得的 Token 的可用时间，过期后将重新登录 (单位 天)
    tokenExpirationTime: 30,
    // 最大的登录密码错误尝试次数。IP和用户名同时计算，任一达到上限均会被临时封禁
    loginMaxTry: 10,
    // 触发密码错误临时封禁后，需要等待多久才能恢复正常 (单位 分钟)
    banWaitTime: 10,
  },
};
