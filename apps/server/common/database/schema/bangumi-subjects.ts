import {
  mysqlTable,
  int,
  varchar,
  longtext,
  tinyint,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

export const subjects = mysqlTable(
  "bangumi_subjects",
  {
    id: int().notNull().autoincrement().primaryKey(),
    bgmid: int().notNull().unique(),
    type: tinyint().notNull().default(2),

    name: varchar({ length: 512 }).notNull(),
    name_cn: varchar({ length: 512 }),

    summary: longtext(),
    nsfw: tinyint().notNull().default(0),
    locked: tinyint().notNull().default(0),

    platform: varchar({ length: 64 }),
    date: varchar({ length: 32 }),
    series: tinyint().notNull().default(0),
    volumes: int().notNull().default(0),

    eps: int().notNull().default(0),
    total_episodes: int().notNull().default(0),

    rating_score: decimal({ precision: 3, scale: 1 }),
    rating_rank: int(),
    rating_total: int(),

    collect_wish: int().notNull().default(0),
    collect_collect: int().notNull().default(0),
    collect_doing: int().notNull().default(0),
    collect_on_hold: int().notNull().default(0),
    collect_dropped: int().notNull().default(0),

    image_large: varchar({ length: 1024 }),
    image_common: varchar({ length: 1024 }),
    image_medium: varchar({ length: 1024 }),
    image_small: varchar({ length: 1024 }),
    image_grid: varchar({ length: 1024 }),

    fetched_at: timestamp({ mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("idx_bgmid").on(table.bgmid),
    index("idx_rating").on(table.rating_score),
    index("idx_name_cn").on(table.name_cn),
    index("idx_bangumi_subject_date").on(table.date),
    index("idx_nsfw").on(table.nsfw),
  ]
);
