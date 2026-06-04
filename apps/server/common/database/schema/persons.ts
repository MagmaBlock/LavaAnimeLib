import {
  mysqlTable,
  int,
  varchar,
  longtext,
  tinyint,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

export const persons = mysqlTable(
  "persons",
  {
    id: int().notNull().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    type: tinyint(),
    short_summary: longtext(),
    locked: tinyint().notNull().default(0),
    image_large: varchar({ length: 1024 }),
    image_medium: varchar({ length: 1024 }),
    image_small: varchar({ length: 1024 }),
    image_grid: varchar({ length: 1024 }),
    updated_at: timestamp({ mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_person_name").on(table.name),
  ]
);
