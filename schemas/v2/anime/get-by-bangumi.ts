import { z } from "zod";

export const getAnimesByBgmIDQuerySchema = z.object({
  bgmid: z.coerce.number().int().positive(),
});
