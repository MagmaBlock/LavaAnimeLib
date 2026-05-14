export default {
  mysql: {
    host: "localhost",
    port: 3307,
    user: "LavaAnimeTest",
    database: "lavaanime_test",
    password: "test_password",
  },
  drive: {
    default: "1A",
    list: [
      {
        id: "1A",
        name: "测试存储节点",
        description: "测试用存储节点",
        banNSFW: false,
        type: "alist",
        host: "https://alist.example.com",
        path: "/test/LavaAnimeLib",
        password: "",
      },
    ],
  },
  bangumi: {
    host: "https://api.bgm.tv",
  },
  bangumiImage: {
    host: "https://lain.bgm.tv/",
  },
  mirai: {
    baseConfig: {
      qqID: 123456789,
      target: {
        group: [],
        friend: [],
      },
      enableVerify: true,
      verifyKey: "test_verify_key",
    },
    adapterSettings: {
      http: {
        baseURL: "https://mirai.example.com",
      },
    },
  },
  oneBot: {
    target: {
      group: [],
    },
    accessToken: "test_access_token",
    adapterSettings: {
      http: {
        baseURL: "https://onebot.example.com",
      },
    },
  },
  cache: 3,
  security: {
    trustProxy: true,
    enableRefererWhiteList: false,
    refererWhiteList: [
      /http(s){0,1}:\/\/localhost(:\d{4,5}|){0,1}/gi,
      /http(s){0,1}:\/\/127\.0\.0\.1(:\d{4,5}|){0,1}/gi,
    ],
    allowEmptyReferer: true,
    tokenExpirationTime: 30,
    loginMaxTry: 10,
    banWaitTime: 1,
  },
};
