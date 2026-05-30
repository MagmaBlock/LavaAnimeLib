import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  json,
} from "drizzle-orm/mysql-core";

export const driveEndpoints = mysqlTable("drive_endpoints", {
  id: int().notNull().autoincrement().primaryKey(),
  driveId: varchar("drive_id", { length: 100 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  configOverride: json("config_override"),
  priority: int().notNull().default(0),
  enabled: tinyint().notNull().default(1),
  banNSFW: tinyint().notNull().default(0),
  disableDownload: tinyint().notNull().default(0),
});
