import { mysqlTable, int, timestamp, primaryKey } from "drizzle-orm/mysql-core";

export const follow = mysqlTable(
  "follow",
  {
    user_id: int().notNull(),
    anime_id: int().notNull(),
    status: int().notNull(),
    edit_time: timestamp({ mode: "date" }).defaultNow().onUpdateNow(),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.anime_id] })]
);
