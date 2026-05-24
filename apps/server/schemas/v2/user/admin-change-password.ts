import { z } from "zod";

export const adminChangePasswordBodySchema = z.object({
  userID: z.number().int().min(1),
  password: z.string().min(7).max(64).regex(/[a-zA-Z]/, "密码至少包含字母"),
});
