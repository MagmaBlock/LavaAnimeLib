import { z } from "zod";

export const changePasswordBodySchema = z.object({
  password: z.string().min(7).max(64).regex(/[a-zA-Z]/, "密码至少包含字母"),
});
