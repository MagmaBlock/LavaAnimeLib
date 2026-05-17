import { mysqlTable, int, text, timestamp } from "drizzle-orm/mysql-core";

export const views = mysqlTable("views", {
  id: int().notNull().autoincrement().primaryKey(),
  ep: text(),
  file: text(),
  ip: text(),
  user: int(),
  time: timestamp({ mode: "date" }).defaultNow(),
  type: text().notNull(),
});
