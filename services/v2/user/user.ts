import cache from "../../../common/cache.js";
import { db } from "../../../common/database/connection.js";
import { user } from "../../../common/database/schema/user.js";
import { eq, or, sql } from "drizzle-orm";

export async function findUser(account) {
  let rows = await db
    .select()
    .from(user)
    .where(or(eq(user.email, account), eq(user.name, account)));
  if (rows.length) {
    let userData = dbUserParser(rows[0]);
    return userData;
  }
  return false;
}

export async function findUserByID(userID) {
  if (!userID) return false;

  if (cache.user?.[userID]) {
    return dbUserParser(cache.user[userID]);
  }

  let rows = await db.select().from(user).where(eq(user.id, userID));
  if (rows[0]) {
    if (!cache.user) cache.user = {};
    cache.user[userID] = rows[0];
    cache.user[userID].expirationTime = new Date(
      new Date().getTime() + 1000 * 60 * 5
    );
    return dbUserParser(rows[0]);
  } else {
    return false;
  }
}

export async function checkEmailExists(email) {
  let rows = await db
    .select()
    .from(user)
    .where(eq(user.email, email));
  return rows.length > 0;
}

export async function checkNameExists(name) {
  let rows = await db
    .select()
    .from(user)
    .where(eq(user.name, name));
  return rows.length > 0;
}

export async function createUser(email, password, name) {
  let result = await db.insert(user).values({ email, password, name });
  return result[0].affectedRows > 0;
}

export async function getNextUserID(): Promise<number> {
  const [rows] = await (db.execute(
    sql`SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user'`
  ) as any);
  return rows[0].AUTO_INCREMENT;
}

export async function updateUserName(userID, name) {
  await db.update(user).set({ name }).where(eq(user.id, userID));
  delete cache.user[userID];
}

export function dbUserParser(userData) {
  try {
    userData.data = JSON.parse(userData.data);
    userData.settings = JSON.parse(userData.settings);
  } catch (error) {
    return userData;
  }
  return userData;
}
