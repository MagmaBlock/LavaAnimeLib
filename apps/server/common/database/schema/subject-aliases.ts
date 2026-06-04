import {
  mysqlTable,
  int,
  varchar,
  index,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";

export const subjectAliases = mysqlTable(
  "subject_aliases",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    alias: varchar({ length: 512 }).notNull(),
  },
  (table) => [
    index("idx_alias").on(table.alias),
    index("idx_subject").on(table.subject_id),
  ]
);
