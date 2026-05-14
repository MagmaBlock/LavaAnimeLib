import { z } from "zod";

export const reportViewHistoryBodySchema = z.object({
  animeID: z.number().int().min(1),
  fileName: z.string().min(1),
  currentTime: z.number().min(0).max(43200),
  totalTime: z.number().min(0).max(43200),
  watchMethod: z.string().min(1),
  useDrive: z.any().optional(),
}).superRefine((data, ctx) => {
  if (data.currentTime > data.totalTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentTime"],
      message: "currentTime must not exceed totalTime",
    });
  }
});
