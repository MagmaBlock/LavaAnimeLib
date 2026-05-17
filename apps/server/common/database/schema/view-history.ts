import { sql } from "drizzle-orm";
import {
  mysqlTable,
  int,
  varchar,
  datetime,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const viewHistory = mysqlTable(
  "view_history",
  {
    id: int().notNull().autoincrement().primaryKey(),
    userID: int().notNull(),
    animeID: int().notNull(),
    fileName: varchar({ length: 255 }),
    episode: varchar({ length: 16 }),
    currentTime: int(),
    totalTime: int(),
    userIP: varchar({ length: 64 }),
    watchMethod: varchar({ length: 32 }),
    lastReportTime: datetime({ mode: "date", fsp: 0 }).default(sql`current_timestamp`),
    useDrive: varchar({ length: 64 }),
  },
  (table) => [
    uniqueIndex("view_history_un").on(
      table.userID,
      table.animeID,
      table.fileName,
      table.watchMethod
    ),
    index("view_history_userID_IDX").on(table.userID, table.animeID),
  ]
);
