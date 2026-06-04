import {
  mysqlTable,
  int,
  varchar,
  longtext,
  tinyint,
  decimal,
  index,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";

export const subjectEpisodes = mysqlTable(
  "subject_episodes",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    bgm_ep_id: int().unique(),
    type: tinyint().notNull().default(0),
    sort: decimal({ precision: 5, scale: 1 }).notNull(),
    ep: int(),
    name: varchar({ length: 512 }),
    name_cn: varchar({ length: 512 }),
    airdate: varchar({ length: 32 }),
    duration: varchar({ length: 32 }),
    desc: longtext(),
    status: varchar({ length: 32 }),
  },
  (table) => [
    index("idx_subject_sort").on(table.subject_id, table.sort),
  ]
);
