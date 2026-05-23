import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { drives } from "../../../common/database/schema/drive.js";
import { mapDriveRecord } from "../admin/drive.js";

export interface DriveInfo {
  id: string;
  name: string;
  description: string;
  banNSFW: boolean;
  disableDownload: boolean;
}

export interface DriveRecord extends DriveInfo {
  type: "alist";
  host: string;
  path: string;
  password: string;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type DriveUpsertInput = Omit<DriveRecord, "createdAt" | "updatedAt">;

export interface DriveListResult {
  default: string;
  list: DriveInfo[];
}

export async function getDriveList(): Promise<DriveListResult> {
  const enabledDrives = await getEnabledDrives();
  return {
    default: getDefaultDriveFromList(enabledDrives).id,
    list: enabledDrives.map((drive) => ({
      id: drive.id,
      name: drive.name,
      description: drive.description,
      banNSFW: drive.banNSFW,
      disableDownload: drive.disableDownload,
    })),
  };
}

export async function getDrive(drive: string): Promise<DriveRecord | undefined> {
  if (!drive) throw new Error("获取 Drive 时未提供 Drive ID");
  const rows = await db
    .select()
    .from(drives)
    .where(and(eq(drives.id, drive), eq(drives.enabled, 1)))
    .limit(1);
  return rows[0] ? mapDriveRecord(rows[0]) : undefined;
}

export async function getDefaultDrive(): Promise<string> {
  return getDefaultDriveFromList(await getEnabledDrives()).id;
}

async function getEnabledDrives(): Promise<DriveRecord[]> {
  const rows = await db
    .select()
    .from(drives)
    .where(eq(drives.enabled, 1))
    .orderBy(asc(drives.sortOrder), asc(drives.id));
  return rows.map(mapDriveRecord);
}

function getDefaultDriveFromList(enabledDrives: DriveRecord[]): DriveRecord {
  if (!enabledDrives.length) throw new Error("没有可用的存储节点");
  return (
    enabledDrives.find((drive) => drive.isDefault)
    ?? enabledDrives[0]
  );
}

export async function getDefaultDriveRecord(): Promise<DriveRecord> {
  return getDefaultDriveFromList(await getEnabledDrives());
}

export async function hasEnabledDefaultDrive(id: string): Promise<boolean> {
  const rows = await db
    .select({ id: drives.id })
    .from(drives)
    .where(and(eq(drives.id, id), eq(drives.enabled, 1), eq(drives.isDefault, 1)))
    .limit(1);
  return rows.length > 0;
}
