import {
  mysqlTable,
  int,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";

export const subjectTags = mysqlTable(
  "subject_tags",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    name: varchar({ length: 128 }).notNull(),
    count: int().notNull().default(0),
  },
  (table) => [
    uniqueIndex("uk_subject_tag").on(table.subject_id, table.name),
  ]
);
