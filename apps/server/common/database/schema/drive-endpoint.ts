import {
  mysqlTable,
  int,
  varchar,
  tinyint,
} from "drizzle-orm/mysql-core";

export const driveEndpoints = mysqlTable("drive_endpoints", {
  id: int().notNull().autoincrement().primaryKey(),
  driveId: varchar("drive_id", { length: 100 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  url: varchar({ length: 512 }).notNull(),
  connectionConfigId: int("connection_config_id").notNull(),
  priority: int().notNull().default(0),
  enabled: tinyint().notNull().default(1),
  banNSFW: tinyint().notNull().default(0),
  disableDownload: tinyint().notNull().default(0),
});
