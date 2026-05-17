import { db } from "../../../common/database/connection.js";
import { anime } from "../../../common/database/schema/anime.js";
import { eq, and } from "drizzle-orm";
import { parseAnime, type ParsedAnime } from "../parser/anime.js";

interface AnimeSummary {
  id: number;
  title: string;
  deleted: boolean;
  [key: string]: unknown;
}

export async function getAnimeByID(laID: number, full = false): Promise<AnimeSummary> {
  if (!isFinite(laID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    const rows = await db
      .select()
      .from(anime)
      .where(and(eq(anime.id, laID), eq(anime.deleted, 0)));

    if (rows.length) {
      const parsedAnime = await parseAnime(rows[0], full);
      return parsedAnime[0];
    } else {
      return { id: laID, title: "已失效的番剧", deleted: true };
    }
  } catch (error) {
    throw error;
  }
}

export async function getAnimesByID(array: number[]): Promise<AnimeSummary[]> {
  const resultList: AnimeSummary[] = [];
  for (const id of array) {
    resultList.push(await getAnimeByID(id));
  }
  return resultList;
}

export async function getAnimesByBgmID(bgmID: number): Promise<AnimeSummary[]> {
  if (!isFinite(bgmID)) throw new Error("ID 无法解析为数字或不存在");

  try {
    const rows = await db
      .select()
      .from(anime)
      .where(and(eq(anime.bgmid, String(bgmID)), eq(anime.deleted, 0)));

    return await parseAnime(rows);
  } catch (error) {
    throw error;
  }
}
