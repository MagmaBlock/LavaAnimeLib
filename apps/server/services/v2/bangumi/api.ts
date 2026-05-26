import { bangumiAPI } from "../../../common/api-clients/bangumi.js";

export async function getBangumiSubjects(bgmID: number): Promise<Record<string, unknown>> {
  const thisSubject = await bangumiAPI.get(`/v0/subjects/${bgmID}`);
  return thisSubject.data;
}

export async function getBangumiRelations(
  bgmID: number,
  allBgmIDInAnimeTable: number[]
): Promise<Record<string, unknown>[]> {
  const thisSubjectRelations = await bangumiAPI.get(`/v0/subjects/${bgmID}/subjects`);
  const thisSubjectRealRelations = [];

  for (const i in thisSubjectRelations.data) {
    const thisRelation = thisSubjectRelations.data[i];
    if (allBgmIDInAnimeTable.includes(thisRelation.id)) {
      thisSubjectRealRelations.push(thisRelation);
    }
  }
  return thisSubjectRealRelations;
}

export async function getBangumiCharacters(bgmID: number): Promise<unknown[]> {
  const thisSubjectCharacters = await bangumiAPI.get(`/v0/subjects/${bgmID}/characters`);
  return thisSubjectCharacters.data;
}
