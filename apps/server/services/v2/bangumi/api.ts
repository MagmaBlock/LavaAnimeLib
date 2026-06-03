import type {
  BangumiSubject,
  BangumiSubjectRelation,
  BangumiRelatedCharacter,
} from "@lavaanime/shared";
import { bangumiAPI } from "../../../common/api-clients/bangumi.js";

export async function getBangumiSubjects(
  bgmID: number
): Promise<BangumiSubject> {
  const { data } = await bangumiAPI.get<BangumiSubject>(`/v0/subjects/${bgmID}`);
  return data;
}

export async function getBangumiRelations(
  bgmID: number,
  allBgmIDInAnimeTable: number[]
): Promise<BangumiSubjectRelation[]> {
  const { data } = await bangumiAPI.get<BangumiSubjectRelation[]>(
    `/v0/subjects/${bgmID}/subjects`
  );
  return data.filter((r) => allBgmIDInAnimeTable.includes(r.id));
}

export async function getBangumiCharacters(
  bgmID: number
): Promise<BangumiRelatedCharacter[]> {
  const { data } = await bangumiAPI.get<BangumiRelatedCharacter[]>(
    `/v0/subjects/${bgmID}/characters`
  );
  return data;
}
