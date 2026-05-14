import { z } from "zod";

export const userRegisterBodySchema = z.object({
  email: z.string().email("邮箱不合法"),
  password: z.string().min(7).max(64).regex(/[a-zA-Z]/, "密码至少包含字母"),
  name: z.string().min(1).max(30),
  inviteCode: z.string().min(1),
});
