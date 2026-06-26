import type {
  BangumiSubject,
  BangumiSubjectRelation,
  BangumiRelatedCharacter,
  BangumiEpisode,
} from "@lavaanime/shared";
import { bangumiAPI } from "../../../common/api-clients/bangumi.js";

export async function getBangumiSubjects(
  bgmID: number
): Promise<BangumiSubject> {
  const { data } = await bangumiAPI.get<BangumiSubject>(`/v0/subjects/${bgmID}`);
  return data;
}

export async function getBangumiRelations(
  bgmID: number
): Promise<BangumiSubjectRelation[]> {
  const { data } = await bangumiAPI.get<BangumiSubjectRelation[]>(
    `/v0/subjects/${bgmID}/subjects`
  );
  return data;
}

export async function getBangumiCharacters(
  bgmID: number
): Promise<BangumiRelatedCharacter[]> {
  const { data } = await bangumiAPI.get<BangumiRelatedCharacter[]>(
    `/v0/subjects/${bgmID}/characters`
  );
  return data;
}

export async function getBangumiEpisodes(
  bgmID: number,
  offset = 0,
  limit = 100
): Promise<BangumiEpisode[]> {
  const { data } = await bangumiAPI.get<{
    data: BangumiEpisode[];
    total: number;
  }>(`/v0/episodes`, {
    params: { subject_id: bgmID, limit, offset },
  });

  if (data.total > offset + limit) {
    const nextPage = await getBangumiEpisodes(bgmID, offset + limit, limit);
    return [...data.data, ...nextPage];
  }

  return data.data;
}
