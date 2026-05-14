import { mysqlTable, varchar, text } from "drizzle-orm/mysql-core";

export const settings = mysqlTable("settings", {
  key: varchar({ length: 100 }).notNull().primaryKey(),
  value: text(),
});
