import { db } from "../../../common/database/connection.js";
import { connectionConfigs } from "../../../common/database/schema/connection-config.js";
import { asc, eq } from "drizzle-orm";

export interface ConnectionConfigRecord {
  id: number;
  type: string;
  config: unknown;
}

export interface ConnectionConfigUpsert {
  type: string;
  config: Record<string, unknown>;
}

function mapRow(row: typeof connectionConfigs.$inferSelect): ConnectionConfigRecord {
  return {
    id: row.id,
    type: row.type,
    config: row.config,
  };
}

export async function getAllConnectionConfigs(): Promise<ConnectionConfigRecord[]> {
  const rows = await db.select().from(connectionConfigs).orderBy(asc(connectionConfigs.id));
  return rows.map(mapRow);
}

export async function getConnectionConfigById(id: number): Promise<ConnectionConfigRecord | undefined> {
  const rows = await db
    .select()
    .from(connectionConfigs)
    .where(eq(connectionConfigs.id, id))
    .limit(1);
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function createConnectionConfig(input: ConnectionConfigUpsert): Promise<number> {
  const result = await db.insert(connectionConfigs).values({
    type: input.type,
    config: input.config,
  });
  return result[0].insertId;
}

export async function updateConnectionConfig(
  id: number,
  input: ConnectionConfigUpsert
): Promise<boolean> {
  if (!(await exists(id))) throw new Error("连接配置不存在");
  await db
    .update(connectionConfigs)
    .set({ type: input.type, config: input.config })
    .where(eq(connectionConfigs.id, id));
  return true;
}

export async function deleteConnectionConfig(id: number): Promise<boolean> {
  if (!(await exists(id))) throw new Error("连接配置不存在");
  await db.delete(connectionConfigs).where(eq(connectionConfigs.id, id));
  return true;
}

async function exists(id: number): Promise<boolean> {
  const rows = await db
    .select({ id: connectionConfigs.id })
    .from(connectionConfigs)
    .where(eq(connectionConfigs.id, id))
    .limit(1);
  return rows.length > 0;
}
