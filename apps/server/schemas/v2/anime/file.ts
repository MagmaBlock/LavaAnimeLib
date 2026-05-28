import { z } from "zod";

export const getFilesByIDQuerySchema = z.object({
  id: z.coerce.number().int().positive(),
  drive: z.string().min(1, "drive is required").optional(),
  endpoint: z.coerce.number().int().positive().optional(),
});

export const refreshFileIndexBodySchema = z.object({
  id: z.number().int().positive(),
  drive: z.string().min(1).optional(),
});
