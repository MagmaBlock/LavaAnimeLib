import { z } from "zod";

export const getFilesByIDQuerySchema = z.object({
  id: z.coerce.number().int().positive(),
  drive: z.string().min(1, "drive is required"),
});
