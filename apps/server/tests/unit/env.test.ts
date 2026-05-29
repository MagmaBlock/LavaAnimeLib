import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, readFileSync: mockReadFileSync };
});

const SNAPSHOT_ENV = { ...process.env };

const FULL_ENV = {
  MYSQL_URL: "mysql://user:pass@localhost:3306/mydb",
  BANGUMI_API_HOST: "https://api.bgm.tv",
  BANGUMI_IMAGE_HOST: "https://lain.bgm.tv/",
  LOG_LEVEL: "info",
  LOG_DIR: "logs",
  LOG_FILE: "app.log",
  SECURITY_TRUST_PROXY: "true",
  SECURITY_LOGIN_MAX_TRY: "10",
  SECURITY_BAN_WAIT_MINUTES: "1",
  SECURITY_TOKEN_EXPIRATION_DAYS: "30",
};

beforeEach(() => {
  vi.resetModules();
  mockReadFileSync.mockReset();
  process.env = { ...SNAPSHOT_ENV };
});

describe("env config", () => {
  describe("without .env file", () => {
    it("parses all config fields correctly", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);

      const { default: config } = await import("../../common/env.js");

      expect(config.mysql).toEqual({
        host: "localhost",
        port: 3306,
        user: "user",
        password: "pass",
        database: "mydb",
      });
      expect(config.bangumi.host).toBe("https://api.bgm.tv");
      expect(config.bangumiImage.host).toBe("https://lain.bgm.tv/");
      expect(config.log).toEqual({
        level: "info",
        dir: "logs",
        file: "app.log",
      });
      expect(config.security).toEqual({
        trustProxy: true,
        loginMaxTry: 10,
        banWaitTime: 1,
        tokenExpirationTime: 30,
      });
    });

    it("applies default values for optional fields", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_DIR;
      delete process.env.LOG_FILE;
      Object.assign(process.env, {
        MYSQL_URL: "mysql://u:p@localhost:3306/db",
        BANGUMI_API_HOST: "https://api.bgm.tv",
        BANGUMI_IMAGE_HOST: "https://lain.bgm.tv/",
        SECURITY_TRUST_PROXY: "true",
        SECURITY_LOGIN_MAX_TRY: "5",
        SECURITY_BAN_WAIT_MINUTES: "10",
        SECURITY_TOKEN_EXPIRATION_DAYS: "7",
      });

      const { default: config } = await import("../../common/env.js");

      expect(config.log.level).toBe("info");
      expect(config.log.dir).toBe("logs");
      expect(config.log.file).toBe("app.log");
    });

    it("throws on missing MYSQL_URL", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.MYSQL_URL = null as unknown as string;

      await expect(() => import("../../common/env.js")).rejects.toThrow(ZodError);
    });

    it("throws on MYSQL_URL not starting with mysql://", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.MYSQL_URL = "postgres://user:pass@localhost:5432/db";

      await expect(() => import("../../common/env.js")).rejects.toThrow(ZodError);
    });

    it("throws on invalid BANGUMI_API_HOST", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.BANGUMI_API_HOST = "not-a-url";

      await expect(() => import("../../common/env.js")).rejects.toThrow(ZodError);
    });

    it("parses url-encoded credentials in MYSQL_URL", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.MYSQL_URL = "mysql://user%40name:p%3Ass@myhost:3307/my_db";

      const { default: config } = await import("../../common/env.js");

      expect(config.mysql.user).toBe("user@name");
      expect(config.mysql.password).toBe("p:ss");
      expect(config.mysql.host).toBe("myhost");
      expect(config.mysql.port).toBe(3307);
      expect(config.mysql.database).toBe("my_db");
    });

    it("defaults port to 3306 when not specified", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.MYSQL_URL = "mysql://user:pass@localhost/db";

      const { default: config } = await import("../../common/env.js");

      expect(config.mysql.port).toBe(3306);
    });

    it("transforms SECURITY_TRUST_PROXY to boolean", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);

      const { default: configTrue } = await import("../../common/env.js");
      expect(configTrue.security.trustProxy).toBe(true);

      vi.resetModules();
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });

      const falseEnv = { ...SNAPSHOT_ENV, ...FULL_ENV, SECURITY_TRUST_PROXY: "false" };
      process.env = falseEnv;

      const { default: configFalse } = await import("../../common/env.js");
      expect(configFalse.security.trustProxy).toBe(false);
    });

    it("rejects SECURITY_TRUST_PROXY with invalid value", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.SECURITY_TRUST_PROXY = "yes";

      await expect(() => import("../../common/env.js")).rejects.toThrow(ZodError);
    });

    it("transforms SECURITY_LOGIN_MAX_TRY to number", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.SECURITY_LOGIN_MAX_TRY = "42";

      const { default: config } = await import("../../common/env.js");

      expect(config.security.loginMaxTry).toBe(42);
    });

    it("rejects non-positive SECURITY_LOGIN_MAX_TRY", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.SECURITY_LOGIN_MAX_TRY = "0";

      await expect(() => import("../../common/env.js")).rejects.toThrow(ZodError);
    });

    it("rejects non-integer SECURITY_BAN_WAIT_MINUTES", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("no .env");
      });
      Object.assign(process.env, FULL_ENV);
      process.env.SECURITY_BAN_WAIT_MINUTES = "1.5";

      await expect(() => import("../../common/env.js")).rejects.toThrow(ZodError);
    });
  });

  describe("with .env file", () => {
    const ENV_KEYS = Object.keys(FULL_ENV);

    it("loads values from .env file", async () => {
      const dotEnvContent = `MYSQL_URL=mysql://fromfile:pass@dbhost:3307/filedb
BANGUMI_API_HOST=https://api.fromenv.tv
BANGUMI_IMAGE_HOST=https://img.fromenv.tv/
LOG_LEVEL=debug
LOG_DIR=custom_logs
LOG_FILE=custom.log
SECURITY_TRUST_PROXY=false
SECURITY_LOGIN_MAX_TRY=5
SECURITY_BAN_WAIT_MINUTES=30
SECURITY_TOKEN_EXPIRATION_DAYS=14
`;
      mockReadFileSync.mockReturnValue(dotEnvContent);
      for (const key of ENV_KEYS) {
        delete process.env[key];
      }

      const { default: config } = await import("../../common/env.js");

      expect(config.mysql.host).toBe("dbhost");
      expect(config.bangumi.host).toBe("https://api.fromenv.tv");
      expect(config.log.level).toBe("debug");
      expect(config.log.dir).toBe("custom_logs");
      expect(config.security.trustProxy).toBe(false);
      expect(config.security.loginMaxTry).toBe(5);
    });

    it("process.env takes precedence over .env file", async () => {
      mockReadFileSync.mockReturnValue(
        `MYSQL_URL=mysql://file:bad@filehost:3306/filedb
SECURITY_LOGIN_MAX_TRY=3
`
      );
      process.env = {
        ...SNAPSHOT_ENV,
        MYSQL_URL: "mysql://env:good@envhost:3306/envdb",
        BANGUMI_API_HOST: "https://api.fromenv.tv",
        BANGUMI_IMAGE_HOST: "https://img.bgm.tv/",
        SECURITY_TRUST_PROXY: "true",
        SECURITY_LOGIN_MAX_TRY: "99",
        SECURITY_BAN_WAIT_MINUTES: "1",
        SECURITY_TOKEN_EXPIRATION_DAYS: "30",
      };

      const { default: config } = await import("../../common/env.js");

      expect(config.mysql.host).toBe("envhost");
      expect(config.mysql.user).toBe("env");
      expect(config.security.loginMaxTry).toBe(99);
    });

    it("skips comments and blank lines", async () => {
      const dotEnvContent = `
# this is a comment
MYSQL_URL=mysql://u:p@localhost:3306/db

# another comment
BANGUMI_API_HOST=https://api.bgm.tv
BANGUMI_IMAGE_HOST=https://img.bgm.tv/
SECURITY_TRUST_PROXY=true
SECURITY_LOGIN_MAX_TRY=10

SECURITY_BAN_WAIT_MINUTES=1
SECURITY_TOKEN_EXPIRATION_DAYS=30
`;
      mockReadFileSync.mockReturnValue(dotEnvContent);
      for (const key of ENV_KEYS) {
        delete process.env[key];
      }

      const { default: config } = await import("../../common/env.js");

      expect(config.mysql.database).toBe("db");
      expect(config.bangumi.host).toBe("https://api.bgm.tv");
      expect(config.security.banWaitTime).toBe(1);
    });

    it("trims whitespace from keys and values", async () => {
      const dotEnvContent = `  MYSQL_URL  =  mysql://u:p@localhost:3306/db  
  BANGUMI_API_HOST  =  https://api.bgm.tv  
  BANGUMI_IMAGE_HOST=https://img.bgm.tv/
  SECURITY_TRUST_PROXY=true
  SECURITY_LOGIN_MAX_TRY=10
  SECURITY_BAN_WAIT_MINUTES=1
  SECURITY_TOKEN_EXPIRATION_DAYS=30
`;
      mockReadFileSync.mockReturnValue(dotEnvContent);
      for (const key of ENV_KEYS) {
        delete process.env[key];
      }

      const { default: config } = await import("../../common/env.js");

      expect(config.bangumi.host).toBe("https://api.bgm.tv");
    });
  });
});
