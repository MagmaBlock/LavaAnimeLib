import { z } from "zod";

export const deleteCodesBodySchema = z.object({
  codes: z.array(z.string().min(1)).min(1),
});
