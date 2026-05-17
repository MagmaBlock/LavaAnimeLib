import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

export const inviteCode = mysqlTable("invite_code", {
  code: varchar({ length: 100 }).notNull().primaryKey(),
  code_user: int(),
  code_creator: int(),
  create_time: timestamp({ mode: "date" }).defaultNow(),
  use_time: timestamp({ mode: "date" }),
  expiration_time: timestamp({ mode: "date" }),
});
