import {
  mysqlTable,
  int,
  varchar,
  longtext,
  tinyint,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

export const characters = mysqlTable(
  "bangumi_characters",
  {
    id: int().notNull().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    name_cn: varchar({ length: 255 }),
    type: tinyint(),
    summary: longtext(),
    image_large: varchar({ length: 1024 }),
    image_medium: varchar({ length: 1024 }),
    image_small: varchar({ length: 1024 }),
    image_grid: varchar({ length: 1024 }),
    updated_at: timestamp({ mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_char_name").on(table.name),
  ]
);
