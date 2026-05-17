import { z } from "zod";

export const getMyViewHistoryBodySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  animeID: z.number().int().min(1).optional(),
  withAnimeData: z.boolean().optional(),
  latestOnly: z.boolean().optional(),
});
