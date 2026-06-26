import { mysqlTable, int, uniqueIndex } from "drizzle-orm/mysql-core";
import { subjects } from "./bangumi-subjects.js";
import { characters } from "./bangumi-characters.js";
import { persons } from "./bangumi-persons.js";

export const subjectCharacterPersons = mysqlTable(
  "bangumi_subject_character_actors",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    character_id: int()
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    person_id: int()
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    sort_order: int().notNull().default(0),
  },
  (table) => [
    uniqueIndex("uk_subject_char_person").on(
      table.subject_id,
      table.character_id,
      table.person_id
    ),
  ]
);
