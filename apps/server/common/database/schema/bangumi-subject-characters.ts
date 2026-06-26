import {
  mysqlTable,
  int,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { subjects } from "./bangumi-subjects.js";
import { characters } from "./bangumi-characters.js";

export const subjectCharacters = mysqlTable(
  "bangumi_subject_characters",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    character_id: int()
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    relation: varchar({ length: 128 }),
    sort_order: int().notNull().default(0),
  },
  (table) => [
    uniqueIndex("uk_subject_char").on(table.subject_id, table.character_id),
  ]
);
