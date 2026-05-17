import { db } from "../../../common/database/connection.js";
import { settings } from "../../../common/database/schema/settings.js";
import { eq } from "drizzle-orm";

type HeaderItem = Record<string, unknown>;

export async function getHeader(): Promise<HeaderItem[]> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "headerData"));
  if (rows.length === 0) {
    return [];
  } else {
    return JSON.parse(rows[0].value!) as HeaderItem[];
  }
}

export async function updateHeader(newData: unknown): Promise<boolean> {
  if (!Array.isArray(newData)) {
    throw new Error("数据必须为数组");
  }

  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "headerData"));
  if (rows.length === 0) {
    await db.insert(settings).values({
      key: "headerData",
      value: JSON.stringify(newData),
    });
  } else {
    await db
      .update(settings)
      .set({ value: JSON.stringify(newData) })
      .where(eq(settings.key, "headerData"));
  }

  return true;
}
