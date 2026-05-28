import { mysqlTable, int, varchar, json } from "drizzle-orm/mysql-core";

export const connectionConfigs = mysqlTable("connection_configs", {
  id: int().notNull().autoincrement().primaryKey(),
  type: varchar({ length: 32 }).notNull(),
  config: json().notNull(),
});
