import { z } from "zod";

export const setEpisodeStartBodySchema = z.object({
  laID: z.number().int().positive(),
  /** episode_start 覆盖值; 当 manual=true 时必填且 >= 1 */
  episode_start: z.number().int().min(1).nullable().optional(),
  /** true = 手动覆盖并设置 episode_start; false = 恢复 auto 并立即重算 */
  manual: z.boolean().default(false),
}).refine(
  (v) => !v.manual || (typeof v.episode_start === "number" && v.episode_start >= 1),
  { message: "manual=true 时 episode_start 必须为 >= 1 的整数" }
);

export const getEpisodeStartQuerySchema = z.object({
  laID: z.coerce.number().int().positive(),
});