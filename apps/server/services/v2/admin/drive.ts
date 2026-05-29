import { asc, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { drives } from "../../../common/database/schema/drive.js";
import type { DriveRecord, DriveUpsertInput } from "../drive/index.js";

function toBoolean(value: number): boolean {
  return value === 1;
}

function toTinyInt(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

export function mapDriveRecord(row: typeof drives.$inferSelect): DriveRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    connectionConfigId: row.connectionConfigId,
    enabled: toBoolean(row.enabled),
    isDefault: toBoolean(row.isDefault),
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsertValue(input: DriveUpsertInput): typeof drives.$inferInsert {
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    connectionConfigId: input.connectionConfigId,
    enabled: toTinyInt(input.enabled),
    isDefault: toTinyInt(input.isDefault),
    sortOrder: input.sortOrder,
  };
}

export async function getAllDrivesForAdmin(): Promise<DriveRecord[]> {
  const rows = await db.select().from(drives).orderBy(asc(drives.sortOrder), asc(drives.id));
  return rows.map(mapDriveRecord);
}

export async function createDrive(input: DriveUpsertInput): Promise<boolean> {
  const insertValue = toInsertValue(input);
  await db.insert(drives).values({ ...insertValue, isDefault: 0 });
  if (input.isDefault) await setDefaultDrive(input.id);
  return true;
}

export async function updateDrive(input: DriveUpsertInput): Promise<boolean> {
  if (!(await driveExists(input.id))) throw new Error("存储节点不存在");
  const shouldBeDefault = input.isDefault;
  await db
    .update(drives)
    .set({ ...toInsertValue(input), isDefault: 0 })
    .where(eq(drives.id, input.id));
  if (shouldBeDefault) await setDefaultDrive(input.id);
  return true;
}

export async function deleteDrive(id: string): Promise<boolean> {
  if (!(await driveExists(id))) throw new Error("存储节点不存在");
  await db.delete(drives).where(eq(drives.id, id));
  return true;
}

export async function setDefaultDrive(id: string): Promise<boolean> {
  if (!(await driveExists(id))) throw new Error("存储节点不存在");
  await clearDefaultDrive(id);
  await db.update(drives).set({ isDefault: 1 }).where(eq(drives.id, id));
  return true;
}

async function driveExists(id: string): Promise<boolean> {
  const rows = await db.select({ id: drives.id }).from(drives).where(eq(drives.id, id)).limit(1);
  return rows.length > 0;
}

async function clearDefaultDrive(exceptId?: string): Promise<void> {
  const rows = await db.select({ id: drives.id }).from(drives);
  for (const row of rows) {
    if (row.id !== exceptId) {
      await db.update(drives).set({ isDefault: 0 }).where(eq(drives.id, row.id));
    }
  }
}
