import { z } from "zod";

export const setEpisodeStartBodySchema = z.object({
  laID: z.number().int().positive(),
  /** 传入 null 表示清除管理员覆盖 (恢复自动计算); 不传 / 传整数则设为覆盖值 */
  episode_start: z.number().int().min(1).nullable().optional(),
});