import { z } from "zod";

export const updatePermissionBodySchema = z.object({
  permission: z.object({}).passthrough(),
  userID: z.union([z.number(), z.string()]),
});
