import { defineConfig } from "drizzle-kit";
import config from "./common/config.js";

export default defineConfig({
  schema: "./common/database/schema/*.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL
      ?? `mysql://${config.mysql.user}:${config.mysql.password}@${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`,
  },
});
