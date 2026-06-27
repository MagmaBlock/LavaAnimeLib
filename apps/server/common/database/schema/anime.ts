import { mysqlTable, int, text, tinyint } from "drizzle-orm/mysql-core";

export const anime = mysqlTable("anime", {
  id: int().notNull().autoincrement().primaryKey(),
  year: text().notNull(),
  type: text().notNull(),
  name: text().notNull(),
  views: int().notNull().default(0),
  bgmid: text(),
  nsfw: tinyint().notNull().default(0),
  title: text(),
  deleted: tinyint().notNull().default(0),
  poster: text(),
  episode_start: int(),
  /** 0 = 自动 (sync 回填覆盖), 1 = 手动 (永不被 sync 改写) */
  episode_start_manual: tinyint().notNull().default(0),
});
