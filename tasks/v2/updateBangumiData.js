import _ from "lodash";
import { bangumiAPI } from "../../common/api.js";
import { promiseDB } from "../../common/sql.js"
import delay from "./tools/delay.js";
let reTry = {}

// 过期时间(天)
const cachedDays = 1

updateAllBangumiData()

// 根据缓存情况更新全部库内数据
async function updateAllBangumiData() {

    let bangumiIDList = await findExpiredBangumiData()
    let bangumiIDListInAnimeTable = await getAllBgmIDInAnimeTable() // Anime 表的 BgmID 用于查找关联番剧
    let chunkedBangumiIdList = _.chunk(bangumiIDList, 3)
    console.log('[Bangumi Data] 需要刷新的 BgmID 列表', chunkedBangumiIdList);

    for (let i in chunkedBangumiIdList) {
        for (let j in chunkedBangumiIdList[i]) {
            await updateBangumiData(chunkedBangumiIdList[i][j], bangumiIDListInAnimeTable) // 传入 bangumiIDListInAnimeTable 优化性能
        }
        // await delay(100)
    }
    console.log('[Bangumi Data] Bangumi Data 刷新完成');
}

// 直接更新给定的 Bangumi ID 的数据库数据
// bangumiIDListInAnimeTable 可选
export default async function updateBangumiData(bgmID, bangumiIDListInAnimeTable) {
    if (!bgmID) throw new Error('No Bangumi ID provided!')
    if (!bangumiIDListInAnimeTable) bangumiIDListInAnimeTable = await getAllBgmIDInAnimeTable()

    let thisSubject = {}
    try {
        thisSubject.subject = await getBangumiSubjects(bgmID);
        thisSubject.relations = await getBangumiRelations(bgmID, bangumiIDListInAnimeTable);
        thisSubject.characters = await getBangumiCharacters(bgmID);
    } catch (error) {
        errorHanding(error, bgmID, bangumiIDListInAnimeTable)
        return
    }

    promiseDB.query(
        'UPDATE bangumi_data SET subjects = ?, relations_anime = ?, characters = ?, update_time = ? WHERE bgmid = ?',
        [JSON.stringify(thisSubject.subject), JSON.stringify(thisSubject.relations), JSON.stringify(thisSubject.characters), new Date(), bgmID]
    )
    console.log(`[Bangumi Data] 成功刷新 bgm${bgmID}`);
    // await delay(100)
}

// 寻找 Bangumi Data 过期的数据 BgmID
async function findExpiredBangumiData() {
    let allBgmIDList = await promiseDB.query('SELECT bgmid,update_time FROM bangumi_data')
    allBgmIDList = allBgmIDList[0]

    let expiredBangumiIDs = new Array();

    for (let i in allBgmIDList) {
        if (isExpired(allBgmIDList[i].update_time) && allBgmIDList[i].bgmid != 0) { // 如果过期了 (3天)
            expiredBangumiIDs.push(allBgmIDList[i].bgmid)
        }
    }

    return expiredBangumiIDs
}
// 过期查验
function isExpired(ts) {
    // 用现在时间减去给定时间
    let cachedTime = new Date() - ts
    if (cachedTime > 1000 * 60 * 60 * 24 * cachedDays) return true
    else return false
}

// 错误处理
async function errorHanding(error, bgmID, bangumiIDListInAnimeTable) {
    if (error.response) { // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        console.log(error.response.data);
        console.log(error.response.status);
    }
    else if (error.request || error.response) { // 请求已经成功发起，但没有收到响应
        if (reTry[bgmID] < 5 || !reTry[bgmID]) {
            reTry[bgmID] = reTry[bgmID] + 1 || 0
            console.log(`[Bangumi Data] bgm${bgmID} 抓取出错，准备重试 (${reTry[bgmID]})`);
            setTimeout(() => {
                updateBangumiData(bgmID, bangumiIDListInAnimeTable)
            }, 1000);
        } else {
            console.error(error);
            console.log(`[Bangumi Data] bgm${bgmID} 抓取出错超限, 已放弃. 以上为出错的内容`);
        }
    }
}

// Bangumi API 信息获取
async function getBangumiSubjects(bgmID) {
    let thisSubject = await bangumiAPI.get('/v0/subjects/' + bgmID)
    return thisSubject.data
}
async function getBangumiRelations(bgmID, allBgmIDInAnimeTable) {
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
async function getBangumiCharacters(bgmID) {
    let thisSubjectCharacters = await bangumiAPI.get('/v0/subjects/' + bgmID + '/characters')
    return thisSubjectCharacters.data
}

// 获取 anime 表所有未删除番剧的 BgmID, 用于关联番剧的查找
async function getAllBgmIDInAnimeTable() {
    let allBgmID = await promiseDB.query('SELECT bgmid FROM anime WHERE deleted = 0')
    let idList = new Array()
    allBgmID[0].forEach(value => idList.push(parseInt(value.bgmid)))
    idList = _.compact(idList)
    return idList
}