import { z } from "zod";

export const userLoginBodySchema = z.object({
  account: z.string().min(1, "缺失参数"),
  password: z.string().min(1, "缺失参数"),
});
