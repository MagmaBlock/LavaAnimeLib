export default {
  mysql: {
    host: "localhost",
    port: 3307,
    user: "LavaAnimeTest",
    database: "lavaanime_test",
    password: "test_password",
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
  log: {
    level: "info" as const,
    dir: "logs",
    file: "app.log",
  },
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
