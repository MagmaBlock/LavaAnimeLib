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

export const getAnimeAdminQuerySchema = z.object({
  laID: z.coerce.number().int().positive(),
});

export const listAnimeAdminQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  /** 按 name / title / bgmid 模糊匹配; 纯数字时也按 laID 精确匹配 */
  search: z.string().trim().max(64).optional(),
  /** 0 = 仅正常, 1 = 仅已删除, 不传 = 全部 */
  deleted: z.coerce.number().int().min(0).max(1).optional(),
});

/** 管理员可编辑字段; 全部 optional 以支持 PATCH 语义 */
export const updateAnimeBodySchema = z.object({
  laID: z.number().int().positive(),
  year: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  bgmid: z.string().nullable().optional(),
  nsfw: z.union([z.literal(0), z.literal(1)]).optional(),
  title: z.string().nullable().optional(),
  deleted: z.union([z.literal(0), z.literal(1)]).optional(),
  poster: z.string().nullable().optional(),
  views: z.number().int().min(0).optional(),
}).refine((v) => {
  const { laID, ...rest } = v;
  return Object.keys(rest).length > 0;
}, { message: "至少需要提供一个可编辑字段" });
