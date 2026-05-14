import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
  id: int().notNull().autoincrement().primaryKey(),
  email: varchar({ length: 100 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  create_time: timestamp({ mode: "date" }).defaultNow(),
  data: varchar({ length: 2048 }),
  settings: varchar({ length: 2048 }),
});
