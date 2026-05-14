import { createHash } from "crypto";
import { db } from "../../../common/database/connection.js";
import { token } from "../../../common/database/schema/token.js";
import { eq, and } from "drizzle-orm";
import cache from "../../../common/cache.js";

export function createToken() {
  let createTime = new Date();

  let tokenRaw =
    createTime.getTime() *
    Math.floor(Math.random() * 1000) *
    Math.floor(Math.random() * 1000);
  let tokenStr = createHash("sha256")
    .update(tokenRaw.toString())
    .update(tokenRaw.toString())
    .digest("base64url")
    .replace(/[^a-zA-Z0-9]/g, "");
  return tokenStr;
}

export async function saveToken(tokenStr, userID, expirationTime) {
  if (!tokenStr || !userID || !expirationTime) throw "参数错误";

  await db.insert(token).values({
    token: tokenStr,
    user: userID,
    expiration_time: expirationTime,
  });
}

let tokenCache = cache.token;

export async function useToken(tokenStr) {
  if (!tokenStr) return false;

  if (tokenCache[tokenStr]) {
    if (tokenCache[tokenStr].expirationTime > new Date()) {
      return tokenCache[tokenStr].user;
    } else {
      return false;
    }
  }

  let rows = await db
    .select()
    .from(token)
    .where(eq(token.token, tokenStr));

  if (rows[0]) {
    if (rows[0].status == 1 && rows[0].expiration_time > new Date()) {
      tokenCache[rows[0].token] = {
        user: rows[0].user,
        expirationTime: new Date(rows[0].expiration_time),
      };
      return rows[0].user;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

export async function removeToken(tokenStr, all = false) {
  if (!tokenStr) throw "缺失参数";

  let userID = await useToken(tokenStr);
  if (userID) {
    if (all) {
      Object.keys(tokenCache).forEach((cacheKey) => {
        if (tokenCache[cacheKey].user == userID) {
          delete tokenCache[cacheKey];
        }
      });
      await db.update(token).set({ status: 0 }).where(eq(token.user, userID));
      return true;
    } else {
      delete tokenCache[tokenStr];
      await db
        .update(token)
        .set({ status: 0 })
        .where(and(eq(token.user, userID), eq(token.token, tokenStr)));
      return true;
    }
  } else {
    return false;
  }
}
