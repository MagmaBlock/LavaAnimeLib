import {
  mysqlTable,
  int,
  varchar,
} from "drizzle-orm/mysql-core";
import { persons } from "./bangumi-persons.js";

export const personCareers = mysqlTable("bangumi_person_careers", {
  id: int().notNull().autoincrement().primaryKey(),
  person_id: int()
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  career: varchar({ length: 128 }).notNull(),
});
