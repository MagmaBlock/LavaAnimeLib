import { z } from "zod";

export const getSiteSettingQuerySchema = z.object({
  key: z.string().min(1),
});

export const setSiteSettingBodySchema = z.object({
  key: z.string().min(1),
  value: z.any().refine(v => v != null, "value is required"),
});
