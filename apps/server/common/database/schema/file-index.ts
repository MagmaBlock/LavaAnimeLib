import {
  mysqlTable,
  int,
  varchar,
  bigint,
  tinyint,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

export const fileIndex = mysqlTable(
  "file_index",
  {
    id: int().notNull().autoincrement().primaryKey(),
    driveId: varchar("drive_id", { length: 100 }).notNull(),
    animeId: int("anime_id"),
    path: varchar({ length: 1024 }).notNull(),
    name: varchar({ length: 512 }).notNull(),
    size: bigint({ mode: "number" }).notNull().default(0),
    type: varchar({ length: 4 }).notNull(),
    deleted: tinyint().notNull().default(0),
    modified: timestamp({ mode: "date" }),
    indexedAt: timestamp("indexed_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    drivePathUk: uniqueIndex("uk_drive_path").on(table.driveId, table.path),
    animeIdIdx: index("idx_anime_id").on(table.animeId),
    driveTypeIdx: index("idx_drive_type").on(table.driveId, table.type),
    deletedIndexedIdx: index("idx_deleted_indexed").on(table.deleted, table.indexedAt),
  }),
);
