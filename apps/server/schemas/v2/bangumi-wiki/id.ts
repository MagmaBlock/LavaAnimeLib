import { z } from "zod";

export const bangumiWikiIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("id must be a positive integer"),
});
