import {
  mysqlTable,
  int,
  varchar,
  index,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";

export const subjectMetaTags = mysqlTable(
  "subject_meta_tags",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    tag: varchar({ length: 128 }).notNull(),
  },
  (table) => [
    index("idx_subject").on(table.subject_id),
  ]
);
