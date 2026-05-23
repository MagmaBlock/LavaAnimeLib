import { z } from "zod";

const driveIdSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

export const driveBodySchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().default(""),
  type: z.literal("alist").default("alist"),
  host: z.string().trim().url().max(512),
  path: z.string().trim().min(1).max(512),
  password: z.string().max(512).default(""),
  banNSFW: z.boolean().default(false),
  disableDownload: z.boolean().default(false),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const createDriveBodySchema = driveBodySchema;
export const updateDriveBodySchema = driveBodySchema;
export const deleteDriveBodySchema = driveIdSchema;
export const setDefaultDriveBodySchema = driveIdSchema;
