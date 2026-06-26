import {
  mysqlTable,
  int,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { characters } from "./bangumi-characters.js";
import { persons } from "./bangumi-persons.js";

export const characterPersons = mysqlTable(
  "bangumi_character_persons",
  {
    id: int().notNull().autoincrement().primaryKey(),
    character_id: int()
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    person_id: int()
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("uk_char_person").on(table.character_id, table.person_id),
  ]
);
