import { db } from "../../../common/database/connection.js";
import { driveEndpoints } from "../../../common/database/schema/drive-endpoint.js";
import { asc, eq } from "drizzle-orm";

export interface EndpointRecord {
  id: number;
  driveId: string;
  name: string;
  url: string;
  connectionConfigId: number;
  priority: number;
  enabled: boolean;
  banNSFW: boolean;
  disableDownload: boolean;
}

export interface EndpointUpsert {
  driveId: string;
  name: string;
  url: string;
  connectionConfigId: number;
  priority: number;
  enabled: boolean;
  banNSFW: boolean;
  disableDownload: boolean;
}

function mapRow(row: typeof driveEndpoints.$inferSelect): EndpointRecord {
  return {
    id: row.id,
    driveId: row.driveId,
    name: row.name,
    url: row.url,
    connectionConfigId: row.connectionConfigId,
    priority: row.priority,
    enabled: toBoolean(row.enabled),
    banNSFW: toBoolean(row.banNSFW),
    disableDownload: toBoolean(row.disableDownload),
  };
}

function toBoolean(value: number): boolean {
  return value === 1;
}

export async function listEndpointsByDrive(driveId: string): Promise<EndpointRecord[]> {
  const rows = await db
    .select()
    .from(driveEndpoints)
    .where(eq(driveEndpoints.driveId, driveId))
    .orderBy(asc(driveEndpoints.priority), asc(driveEndpoints.id));
  return rows.map(mapRow);
}

export async function createEndpoint(input: EndpointUpsert): Promise<number> {
  const result = await db.insert(driveEndpoints).values({
    driveId: input.driveId,
    name: input.name,
    url: input.url,
    connectionConfigId: input.connectionConfigId,
    priority: input.priority,
    enabled: input.enabled ? 1 : 0,
    banNSFW: input.banNSFW ? 1 : 0,
    disableDownload: input.disableDownload ? 1 : 0,
  });
  return result[0].insertId;
}

export async function updateEndpoint(id: number, input: EndpointUpsert): Promise<boolean> {
  if (!(await exists(id))) throw new Error("端点不存在");
  await db
    .update(driveEndpoints)
    .set({
      driveId: input.driveId,
      name: input.name,
      url: input.url,
      connectionConfigId: input.connectionConfigId,
      priority: input.priority,
      enabled: input.enabled ? 1 : 0,
      banNSFW: input.banNSFW ? 1 : 0,
      disableDownload: input.disableDownload ? 1 : 0,
    })
    .where(eq(driveEndpoints.id, id));
  return true;
}

export async function deleteEndpoint(id: number): Promise<boolean> {
  if (!(await exists(id))) throw new Error("端点不存在");
  await db.delete(driveEndpoints).where(eq(driveEndpoints.id, id));
  return true;
}

async function exists(id: number): Promise<boolean> {
  const rows = await db
    .select({ id: driveEndpoints.id })
    .from(driveEndpoints)
    .where(eq(driveEndpoints.id, id))
    .limit(1);
  return rows.length > 0;
}
