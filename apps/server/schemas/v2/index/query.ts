import { z } from "zod";

export const queryAnimeByIndexBodySchema = z.object({
  year: z.string().optional(),
  type: z.string().optional(),
}).refine(data => data.year || data.type, {
  message: "at least one of year or type is required",
});
