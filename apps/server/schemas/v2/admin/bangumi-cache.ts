import { z } from "zod";

export const listBangumiCacheQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(200).default(50),
});

export const updateBangumiCacheSettingsBodySchema = z.object({
  autoUpdateEnabled: z.boolean().optional(),
  expireHours: z.coerce.number().int().min(1).max(24 * 365).optional(),
});

export const refreshBangumiCacheBodySchema = z.object({
  bgmID: z.coerce.number().int().positive(),
});
