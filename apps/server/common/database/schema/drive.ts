import {
  mysqlTable,
  varchar,
  text,
  tinyint,
  int,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";

export const drives = mysqlTable("drives", {
  id: varchar({ length: 100 }).notNull().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  description: text().notNull(),
  type: varchar({ length: 32 }).notNull(),
  config: json().notNull(),
  enabled: tinyint().notNull().default(1),
  isDefault: tinyint().notNull().default(0),
  sortOrder: int().notNull().default(0),
  banNSFW: tinyint().notNull().default(0),
  lastScanAt: timestamp("last_scan_at", { mode: "date" }),
  lastScanOk: tinyint("last_scan_ok"),
  lastScanRows: int("last_scan_rows"),
  lastScanError: text("last_scan_error"),
  createdAt: timestamp({ mode: "date" }).defaultNow(),
  updatedAt: timestamp({ mode: "date" }).defaultNow().onUpdateNow(),
});
