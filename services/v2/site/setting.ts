import { db } from "../../../common/database/connection.js";
import { settings } from "../../../common/database/schema/settings.js";
import { eq } from "drizzle-orm";

export async function getSiteSetting(key) {
  let rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));

  let result = rows[0];
  if (result !== undefined) {
    try {
      return JSON.parse(result?.value);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return result?.value;
      } else {
        throw error;
      }
    }
  } else {
    return null;
  }
}

export async function setSiteSetting(key, value) {
  await db
    .insert(settings)
    .values({ key, value: JSON.stringify(value) })
    .onDuplicateKeyUpdate({
      set: { value: JSON.stringify(value) },
    });
  return true;
}
