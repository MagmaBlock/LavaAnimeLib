import type { User } from "../../../types/models.js";
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
    return dbUserParser(rows[0] as unknown as User);
  }
  return false;
}

export async function findUserByID(userID: number): Promise<User | false> {
  if (!userID) return false;

  if (cache.user?.[userID]) {
    return dbUserParser(cache.user[userID] as unknown as User);
  }

  const rows = await db.select().from(user).where(eq(user.id, userID));
  if (rows[0]) {
    if (!cache.user) cache.user = {};
    cache.user[userID] = rows[0] as unknown as Record<string, unknown>;
    (cache.user[userID] as unknown as User).expirationTime = new Date(
      new Date().getTime() + 1000 * 60 * 5
    );
    return dbUserParser(rows[0] as unknown as User);
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

export async function getNextUserID(): Promise<number> {
  const [rows] = await db.execute(
    sql`SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user'`
  );
  return (rows as unknown as Record<string, unknown>[])[0].AUTO_INCREMENT as number;
}

export async function updateUserName(userID: number, name: string): Promise<void> {
  await db.update(user).set({ name }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export function dbUserParser(userData: User): User {
  try {
    userData.data = JSON.parse(userData.data as unknown as string);
    userData.settings = JSON.parse(userData.settings as unknown as string);
  } catch {
    return userData;
  }
  return userData;
}
