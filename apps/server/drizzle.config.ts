import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./common/database/schema/*.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL ?? process.env.MYSQL_URL!,
  },
});
