import type { User, UserRow } from "../../../types/models.js";
import cache from "../../../common/cache.js";
import { db } from "../../../common/database/connection.js";
import { user } from "../../../common/database/schema/user.js";
import { eq, or, sql } from "drizzle-orm";

export async function findUser(account: string): Promise<User | false> {
  const rows = await db
    .select()
    .from(user)
    .where(or(eq(user.email, account), eq(user.name, account)));
  if (rows.length) {
    return dbUserParser(rows[0]);
  }
  return false;
}

export async function findUserByID(userID: number): Promise<User | false> {
  if (!userID) return false;

  if (cache.user?.[userID]) {
    return dbUserParser(cache.user[userID] as unknown as UserRow);
  }

  const rows = await db.select().from(user).where(eq(user.id, userID));
  if (rows[0]) {
    if (!cache.user) cache.user = {};
    cache.user[userID] = {
      ...rows[0],
      expirationTime: new Date(Date.now() + 1000 * 60 * 5),
    };
    return dbUserParser(rows[0]);
  } else {
    return false;
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(user)
    .where(eq(user.email, email));
  return rows.length > 0;
}

export async function checkNameExists(name: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(user)
    .where(eq(user.name, name));
  return rows.length > 0;
}

export async function createUser(email: string, password: string, name: string): Promise<boolean> {
  const result = await db.insert(user).values({ email, password, name });
  return result[0].affectedRows > 0;
}

interface AutoIncrementRow {
  AUTO_INCREMENT: number;
}

export async function getNextUserID(): Promise<number> {
  const [rows] = await db.execute(
    sql`SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user'`
  );
  const autoIncrementRows = rows as unknown as AutoIncrementRow[];
  return autoIncrementRows[0].AUTO_INCREMENT;
}

export async function updateUserName(userID: number, name: string): Promise<void> {
  await db.update(user).set({ name }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export function dbUserParser(userData: UserRow): User {
  try {
    const data = JSON.parse(userData.data ?? "null") as User["data"];
    const settings = JSON.parse(userData.settings ?? "null") as User["settings"];
    return { ...userData, data, settings };
  } catch {
    return { ...userData, data: null, settings: null };
  }
}
