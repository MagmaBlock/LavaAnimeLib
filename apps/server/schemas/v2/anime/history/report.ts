import { z } from "zod";

export const reportViewHistoryBodySchema = z.object({
  animeID: z.number().int().min(1),
  fileName: z.string().min(1),
  currentTime: z.number().min(0).max(43200).nullable().optional(),
  totalTime: z.number().min(0).max(43200).nullable().optional(),
  watchMethod: z.string().min(1),
  useDrive: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.currentTime != null && data.totalTime != null && data.currentTime > data.totalTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentTime"],
      message: "currentTime must not exceed totalTime",
    });
  }
});
