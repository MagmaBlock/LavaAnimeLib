import { z } from "zod";

export const getAnimesByIDBodySchema = z.object({
  ids: z.array(z.number()).min(1).max(79, "ids array must have fewer than 80 items"),
});
