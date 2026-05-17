import { z } from "zod";

export const getAnimeFollowListBodySchema = z.object({
  status: z.array(z.number().int().min(0).max(2)).min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(15),
});
