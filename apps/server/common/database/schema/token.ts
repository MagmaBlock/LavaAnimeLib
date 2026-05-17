import { mysqlTable, int, varchar, timestamp, tinyint } from "drizzle-orm/mysql-core";

export const token = mysqlTable("token", {
  token: varchar({ length: 256 }).notNull().primaryKey(),
  user: int().notNull(),
  create_time: timestamp({ mode: "date" }).notNull().defaultNow(),
  expiration_time: timestamp({ mode: "date" }).notNull().defaultNow(),
  status: tinyint().notNull().default(1),
});
