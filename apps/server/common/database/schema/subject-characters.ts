import {
  mysqlTable,
  int,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";
import { characters } from "./characters.js";

export const subjectCharacters = mysqlTable(
  "subject_characters",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    character_id: int()
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    relation: varchar({ length: 128 }),
  },
  (table) => [
    uniqueIndex("uk_subject_char").on(table.subject_id, table.character_id),
  ]
);
