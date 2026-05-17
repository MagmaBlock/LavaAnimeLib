import { z } from "zod";

export const editAnimeFollowBodySchema = z.object({
  id: z.number().int().min(1),
  status: z.number().int().min(0).max(2).optional(),
  remove: z.boolean().optional(),
});
