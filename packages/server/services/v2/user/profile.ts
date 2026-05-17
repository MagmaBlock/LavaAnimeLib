import cache from "../../../common/cache.js";
import { db } from "../../../common/database/connection.js";
import { user } from "../../../common/database/schema/user.js";
import { eq } from "drizzle-orm";

export async function updateUserData(data: Record<string, unknown>, userID: number): Promise<void> {
  if (!data || !userID) throw new Error("未提供 userID");

  const dataStr = JSON.stringify(data);

  await db.update(user).set({ data: dataStr }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export async function changeUserPassword(userID: number, password: string): Promise<void> {
  if (!userID || !password) throw new Error("未提供 userID 或 password");

  await db.update(user).set({ password }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export async function updateUserSettings(settingsData: Record<string, unknown>, userID: number): Promise<void> {
  if (!settingsData || !userID) throw new Error("未提供 userID");

  const settingsStr = JSON.stringify(settingsData);

  await db.update(user).set({ settings: settingsStr }).where(eq(user.id, userID));
  delete cache.user[userID];
}
