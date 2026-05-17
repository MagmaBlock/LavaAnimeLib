import { z } from "zod";

export const updateNameBodySchema = z.object({
  name: z.string().min(1).max(30),
});
