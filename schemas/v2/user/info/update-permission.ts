import { z } from "zod";

export const updatePermissionBodySchema = z.object({
  permission: z.any(),
  userID: z.union([z.number(), z.string()]),
});
