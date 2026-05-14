import { z } from "zod";

export const getUserInfoQuerySchema = z.object({
  userID: z.string().optional(),
});
