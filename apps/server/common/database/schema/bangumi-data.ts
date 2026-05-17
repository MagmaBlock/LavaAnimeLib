import { mysqlTable, int, longtext, timestamp } from "drizzle-orm/mysql-core";

export const bangumiData = mysqlTable("bangumi_data", {
  bgmid: int().notNull().primaryKey(),
  relations_anime: longtext(),
  subjects: longtext(),
  characters: longtext(),
  update_time: timestamp({ mode: "date" }).defaultNow(),
});
