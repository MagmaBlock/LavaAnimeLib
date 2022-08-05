import { bangumiAPI } from "../../common/api.js";

// Bangumi API 信息获取
export async function getBangumiSubjects(bgmID) {
    let thisSubject = await bangumiAPI.get('/v0/subjects/' + bgmID)
    return thisSubject.data
}
export async function getBangumiRelations(bgmID, allBgmIDInAnimeTable) {
    let thisSubjectRelations = await bangumiAPI.get('/v0/subjects/' + bgmID + '/subjects')
    let thisSubjectRealRelations = new Array() // 存储找到的关联番剧

    for (let i in thisSubjectRelations.data) { // 查找关联番剧
        let thisRelation = thisSubjectRelations.data[i]
        if (allBgmIDInAnimeTable.includes(thisRelation.id)) { // 关联的作品是否存在于番剧库
            thisSubjectRealRelations.push(thisRelation) // 推送
        }
    }
    return thisSubjectRealRelations
}
export async function getBangumiCharacters(bgmID) {
    let thisSubjectCharacters = await bangumiAPI.get('/v0/subjects/' + bgmID + '/characters')
    return thisSubjectCharacters.data
}