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
  type: varchar({ length: 32 }).notNull().default("alist"),
  host: varchar({ length: 512 }).notNull(),
  path: varchar({ length: 512 }).notNull(),
  password: varchar({ length: 512 }).notNull().default(""),
  banNSFW: tinyint().notNull().default(0),
  disableDownload: tinyint().notNull().default(0),
  enabled: tinyint().notNull().default(1),
  isDefault: tinyint().notNull().default(0),
  sortOrder: int().notNull().default(0),
  createdAt: timestamp({ mode: "date" }).defaultNow(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().onUpdateNow(),
});
