import { z } from "zod";

export const getUserInfoQuerySchema = z.object({
  userID: z.coerce.number().int().positive().optional(),
});
