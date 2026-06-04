import {
  mysqlTable,
  int,
  tinyint,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { subjects } from "./subjects.js";

export const subjectRatingCounts = mysqlTable(
  "subject_rating_counts",
  {
    subject_id: int()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    star: tinyint().notNull(),
    count: int().notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.subject_id, table.star] }),
  ]
);
