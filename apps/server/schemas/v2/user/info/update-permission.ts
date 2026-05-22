import { z } from "zod";

export const updatePermissionBodySchema = z.object({
  permission: z.object({}).passthrough(),
  userID: z.number().int().min(1),
});
