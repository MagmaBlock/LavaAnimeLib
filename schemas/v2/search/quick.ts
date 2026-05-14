import { z } from "zod";

export const quickSearchQuerySchema = z.object({
  value: z.string().min(1, "value must be a non-empty string"),
});
