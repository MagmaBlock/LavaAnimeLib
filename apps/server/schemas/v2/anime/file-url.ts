import { z } from "zod";

export const getFileUrlQuerySchema = z.object({
  drive: z.string().min(1),
  path: z.string().min(1),
  endpoint: z.coerce.number().int().positive().optional(),
});
