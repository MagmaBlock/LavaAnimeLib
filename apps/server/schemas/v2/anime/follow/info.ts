import { z } from "zod";

export const getAnimeFollowInfoQuerySchema = z.object({
  id: z.coerce.number().int().min(0),
});
