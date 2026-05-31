import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../common/database/connection.js";
import { driveEndpoints } from "../../../common/database/schema/drive-endpoint.js";
import { createDriver } from "../../../common/filesystem/factory.js";
import { getDrive } from "../drive/index.js";
import { parseJsonField } from "../../../common/tools/parse-json-field.js";
import type { DriveConfigOverride } from "@lavaanime/shared";

export async function getFileDownloadUrl(
  driveId: string,
  filePath: string,
  endpointId?: number
): Promise<string> {
  const driveRecord = await getDrive(driveId);
  if (!driveRecord) throw new Error("存储节点不存在");

  const endpoint = await resolveEndpoint(driveId, endpointId);
  if (!endpoint) throw new Error("没有可用的对外节点");

  const effectiveConfig = endpoint.configOverride
    ? { ...driveRecord.config, ...endpoint.configOverride }
    : driveRecord.config;

  const driver = createDriver({ type: driveRecord.type, config: effectiveConfig });

  return driver.getDownloadUrl(
    { name: filePath.split("/").pop() ?? filePath, path: filePath, type: "file", size: 0, modified: "" },
    effectiveConfig.host,
  );
}

async function resolveEndpoint(
  driveId: string,
  endpointId?: number
): Promise<{ id: number; configOverride: DriveConfigOverride | null } | null> {
  if (endpointId != null) {
    const rows = await db
      .select({
        id: driveEndpoints.id,
        configOverride: driveEndpoints.configOverride,
      })
      .from(driveEndpoints)
      .where(and(
        eq(driveEndpoints.id, endpointId),
        eq(driveEndpoints.driveId, driveId),
        eq(driveEndpoints.enabled, 1),
      ))
      .limit(1);
    if (!rows[0]) return null;
    const override = parseJsonField(rows[0].configOverride);
    return {
      id: rows[0].id,
      configOverride: (override && Object.keys(override).length > 0 ? override : null) as DriveConfigOverride | null,
    };
  }

  const rows = await db
    .select({
      id: driveEndpoints.id,
      configOverride: driveEndpoints.configOverride,
    })
    .from(driveEndpoints)
    .where(and(eq(driveEndpoints.driveId, driveId), eq(driveEndpoints.enabled, 1)))
    .orderBy(asc(driveEndpoints.priority), asc(driveEndpoints.id));

  if (!rows[0]) return null;
  const override = parseJsonField(rows[0].configOverride);
  return {
    id: rows[0].id,
    configOverride: (override && Object.keys(override).length > 0 ? override : null) as DriveConfigOverride | null,
  };
}
