import { z } from "zod";

export const endpointIdSchema = z.object({
  id: z.number().int().positive(),
});

export const endpointDriveIdSchema = z.object({
  driveId: z.string().trim().min(1).max(100),
});

export const configOverrideSchema = z.object({
  host: z.string().trim().min(1).max(512).optional(),
  path: z.string().trim().min(1).max(512).optional(),
  password: z.string().trim().max(256).optional(),
});

export const endpointBodySchema = z.object({
  driveId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  configOverride: configOverrideSchema.nullable().default(null),
  priority: z.number().int().default(0),
  enabled: z.boolean().default(true),
  banNSFW: z.boolean().default(false),
  disableDownload: z.boolean().default(false),
});

export const createEndpointBodySchema = endpointBodySchema;
export const updateEndpointBodySchema = z.intersection(endpointIdSchema, endpointBodySchema);
export const deleteEndpointBodySchema = endpointIdSchema;
export const listEndpointsBodySchema = endpointDriveIdSchema;
