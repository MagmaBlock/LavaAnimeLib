import { sql } from "drizzle-orm";
import { mysqlTable, int, text, tinyint, datetime, index } from "drizzle-orm/mysql-core";
import { anime } from "./anime.js";
import { bangumiData } from "./bangumi-data.js";

export const uploadMessage = mysqlTable(
  "upload_message",
  {
    id: int().notNull().autoincrement().primaryKey(),
    index: text().notNull(),
    animeID: int().references(() => anime.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    bangumiID: int().references(() => bangumiData.bgmid, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    fileName: text(),
    messageSentStatus: tinyint().notNull().default(0),
    uploadTime: datetime({ mode: "date", fsp: 3 }).default(sql`current_timestamp(3)`),
    messageSkiped: tinyint().notNull().default(0),
  },
  (table) => [
    index("upload_message_animeID_fkey").on(table.animeID),
    index("upload_message_bangumiID_fkey").on(table.bangumiID),
  ]
);
