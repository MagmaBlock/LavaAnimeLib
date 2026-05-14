import { z } from "zod";

export const getRecentUpdatesQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(0).default(20),
  ignoreDuplicate: z.coerce.boolean().default(true),
});
