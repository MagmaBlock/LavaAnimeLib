import { z } from "zod";

export const fileIndexListQuerySchema = z.object({
  driveId: z.string().trim().min(1).max(100),
  parent: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "size", "indexedAt", "type"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  type: z.enum(["file", "dir"]).optional(),
  deleted: z.coerce.number().int().min(0).max(1).optional(),
});

export const fileIndexSearchQuerySchema = fileIndexListQuerySchema;

export const fileIndexRefreshDirBodySchema = z.object({
  driveId: z.string().trim().min(1).max(100),
  dirPath: z.string().trim().min(1),
});

export const fileIndexRefreshDriveBodySchema = z.object({
  driveId: z.string().trim().min(1).max(100),
});

export const fileIndexStatsQuerySchema = z.object({
  driveId: z.string().trim().min(1).max(100),
});
