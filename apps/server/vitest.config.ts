import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      MYSQL_URL: "mysql://LavaAnimeTest:test_password@localhost:3307/lavaanime_test",
      BANGUMI_API_HOST: "https://api.bgm.tv",
      BANGUMI_IMAGE_HOST: "https://lain.bgm.tv/",
      LOG_LEVEL: "error",
      LOG_DIR: "logs",
      LOG_FILE: "app.log",
      SECURITY_TRUST_PROXY: "true",
      SECURITY_LOGIN_MAX_TRY: "10",
      SECURITY_BAN_WAIT_MINUTES: "1",
      SECURITY_TOKEN_EXPIRATION_DAYS: "30",
    },
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
  },
});
