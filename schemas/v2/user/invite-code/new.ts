import { z } from "zod";

export const createInviteCodeBodySchema = z.object({
  amount: z.number().int().min(1).default(1),
  expirationTime: z.string().optional(),
});
