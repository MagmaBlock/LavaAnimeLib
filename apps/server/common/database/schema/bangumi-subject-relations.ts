import {
  mysqlTable,
  int,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { subjects } from "./bangumi-subjects.js";

export const subjectRelations = mysqlTable(
  "bangumi_subject_relations",
  {
    id: int().notNull().autoincrement().primaryKey(),
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    related_bgmid: int().notNull(),
    related_type: int(),
    related_name: varchar({ length: 512 }),
    related_name_cn: varchar({ length: 512 }),
    relation_type: varchar({ length: 128 }),
    image_large: varchar({ length: 1024 }),
    image_common: varchar({ length: 1024 }),
    image_medium: varchar({ length: 1024 }),
    image_small: varchar({ length: 1024 }),
    image_grid: varchar({ length: 1024 }),
    sort_order: int().notNull().default(0),
  },
  (table) => [uniqueIndex("uk_subject_rel").on(table.subject_id, table.related_bgmid)]
);
