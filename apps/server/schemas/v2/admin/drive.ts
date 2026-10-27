import { z } from "zod";

const driveIdSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

export const alistConfigSchema = z.object({
  host: z.string().trim().min(1, "Host 不能为空").max(512),
  path: z.string().trim().min(1, "Path 不能为空").max(512),
  password: z.string().trim().max(256).default(""),
  token: z.string().trim().max(512).optional(),
  signExpireHours: z.number().int().min(0).optional(),
});

export const driveBodySchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().default(""),
  type: z.literal("alist"),
  config: alistConfigSchema,
  banNSFW: z.boolean().default(false),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  /** 是否参与番剧库识别；测试/归档节点设为 false, 默认 true */
  librarySync: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const createDriveBodySchema = driveBodySchema;
export const updateDriveBodySchema = driveBodySchema;
export const deleteDriveBodySchema = driveIdSchema;
export const setDefaultDriveBodySchema = driveIdSchema;
