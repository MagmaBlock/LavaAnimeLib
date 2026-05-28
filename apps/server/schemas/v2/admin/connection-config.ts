import { z } from "zod";

export const connectionConfigBodySchema = z.object({
  type: z.string().trim().min(1).max(32),
  config: z.record(z.string(), z.unknown()),
});

export const connectionConfigIdSchema = z.object({
  id: z.number().int().positive(),
});

export const createConnectionConfigBodySchema = connectionConfigBodySchema;
export const updateConnectionConfigBodySchema = z.intersection(
  connectionConfigIdSchema,
  connectionConfigBodySchema
);
export const deleteConnectionConfigBodySchema = connectionConfigIdSchema;
