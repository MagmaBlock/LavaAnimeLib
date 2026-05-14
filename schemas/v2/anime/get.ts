import { z } from "zod";

export const getAnimeByIDQuerySchema = z.object({
  id: z.coerce.number().finite().positive("id must be a positive finite number"),
  full: z.coerce.boolean().optional(),
});
