import cache from "../../../common/cache.js";
import { db } from "../../../common/database/connection.js";
import { user } from "../../../common/database/schema/user.js";
import { eq } from "drizzle-orm";

export async function updateUserData(data, userID) {
  if (!data || !userID) throw "未提供 userID";

  data = JSON.stringify(data);

  await db.update(user).set({ data }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export async function changeUserPassword(userID, password) {
  if (!userID || !password) throw "未提供 userID 或 password";

  await db.update(user).set({ password }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export async function updateUserSettings(settingsData, userID) {
  if (!settingsData || !userID) throw "未提供 userID";

  settingsData = JSON.stringify(settingsData);

  await db.update(user).set({ settings: settingsData }).where(eq(user.id, userID));
  delete cache.user[userID];
}
