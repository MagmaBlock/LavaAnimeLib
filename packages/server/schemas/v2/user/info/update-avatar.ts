import { z } from "zod";

export const updateAvatarBodySchema = z.object({
  url: z.string().url("无法识别, 请检查 URL 是否合法"),
});
