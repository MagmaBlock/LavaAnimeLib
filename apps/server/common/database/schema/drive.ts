import {
  mysqlTable,
  varchar,
  text,
  tinyint,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

export const drives = mysqlTable("drives", {
  id: varchar({ length: 100 }).notNull().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  description: text().notNull(),
  connectionConfigId: int("connection_config_id"),
  banNSFW: tinyint().notNull().default(0),
  disableDownload: tinyint().notNull().default(0),
  enabled: tinyint().notNull().default(1),
  isDefault: tinyint().notNull().default(0),
  sortOrder: int().notNull().default(0),
  createdAt: timestamp({ mode: "date" }).defaultNow(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().onUpdateNow(),
});
