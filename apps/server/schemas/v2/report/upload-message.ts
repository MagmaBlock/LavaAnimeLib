import { z } from "zod";

export const reportUploadMessageBodySchema = z.object({
  index: z.string().min(1),
  fileName: z.string().min(1),
});
