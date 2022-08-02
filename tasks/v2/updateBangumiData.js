import _ from "lodash";
import { bangumiAPI } from "../../common/api.js";
import { promiseDB } from "../../common/sql.js"
import delay from "./tools/delay.js";

const cachedDays = 1

updateAllBangumiData()
async function updateAllBangumiData() { // 根据缓存情况更新全部库内数据
    let allBgmIDList = await promiseDB.query('SELECT bgmid,update_time FROM bangumi_data')
    allBgmIDList = allBgmIDList[0]

    for (let i in allBgmIDList) {
        console.log(allBgmIDList[i].bgmid);
        if (isExpired(allBgmIDList[i].update_time) && allBgmIDList[i].bgmid != 0) { // 如果过期了 (3天)
            updateBangumiData(allBgmIDList[i].bgmid)
            console.log(`[百科刷新] 刷新了bgm${allBgmIDList[i].bgmid}`);
        }
        await delay(100);
    }
}


export default async function updateBangumiData(bgmID) { // 直接更新给定的 Bangumi ID 的数据库数据
    if (!bgmID) throw new Error('No Bangumi ID provided!')

    let thisSubject = await getBangumiSubjects(bgmID);
    let thisSubjectRelations = await getBangumiRelations(bgmID);
    let thisSubjectCharacters = await getBangumiCharacters(bgmID);

    promiseDB.query(
        'UPDATE bangumi_data SET subjects = ?, relations_anime = ?, characters = ? WHERE bgmid = ?',
        [JSON.stringify(thisSubject), JSON.stringify(thisSubjectRelations), JSON.stringify(thisSubjectCharacters), bgmID]
    )
}


async function getBangumiSubjects(bgmID) {
    let thisSubject = await bangumiAPI.get('/v0/subjects/' + bgmID).catch(error => errorHanding(error))
    return thisSubject.data
}

async function getBangumiRelations(bgmID) {
    let thisSubjectRelations = await bangumiAPI.get('/v0/subjects/' + bgmID + '/subjects').catch(error => errorHanding(error))
    return thisSubjectRelations.data
}

async function getBangumiCharacters(bgmID) {
    let thisSubjectCharacters = await bangumiAPI.get('/v0/subjects/' + bgmID + '/characters').catch(error => errorHanding(error))
    return thisSubjectCharacters.data
}

function isExpired(ts) {
    // 用现在时间减去给定时间
    let cachedTime = new Date() - ts
    if (cachedTime > 1000 * 60 * 60 * 24 * cachedDays) return true
    else return false
}

function errorHanding(error) {
    if (error.request) {
        console.log();
    }
}