import type { User, UserRow } from "../../../types/models.js";
import { db } from "../../../common/database/connection.js";
import { user } from "../../../common/database/schema/user.js";
import { sql } from "drizzle-orm";
import { dbUserParser } from "./user.js";

export async function listUsers(offset: number, limit: number): Promise<{ list: User[]; total: number }> {
  const [countRows, dataRows] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(user),
    db.select().from(user).orderBy(user.id).limit(limit).offset(offset),
  ]);

  const total = countRows[0]?.count ?? 0;
  const list = (dataRows as UserRow[]).map(dbUserParser);

  return { list, total };
}

export async function countUsers(): Promise<number> {
  const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(user);
  return rows[0]?.count ?? 0;
}
