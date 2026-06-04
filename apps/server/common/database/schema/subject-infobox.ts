import {
  mysqlTable,
  int,
  varchar,
  text,
  index,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";

export const subjectInfobox = mysqlTable(
  "subject_infobox",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    key: varchar({ length: 128 }).notNull(),
    sub_key: varchar({ length: 255 }),
    value: text().notNull(),
    sort_order: int().notNull().default(0),
  },
  (table) => [
    index("idx_subject_key").on(table.subject_id, table.key),
  ]
);
