import { promiseDB } from "../../common/sql.js";
import config from "../../common/config.js";
import { updateBangumiData } from "./updateBangumiData.js";
import _ from "lodash";

export async function findExpiredBangumiData() {
    /* 
        寻找 Bangumi Data 过期的数据 BgmID, 根据 config 设置的时间判断
    */

    let allBgmIDList = await promiseDB.query('SELECT bgmid,update_time FROM bangumi_data')
    allBgmIDList = allBgmIDList[0]

    let expiredbgmIDs = new Array();
    for (let i in allBgmIDList) {
        if (isExpired(allBgmIDList[i].update_time) && allBgmIDList[i].bgmid != 0) { // 如果过期了 (依据 config)
            expiredbgmIDs.push(allBgmIDList[i].bgmid)
        }
    }
    return expiredbgmIDs

}

function isExpired(ts) {
    // 过期查验
    let cachedTime = new Date() - ts // 用现在时间减去给定时间
    if (cachedTime > 1000 * 60 * 60 * 24 * config.cache) return true
    else return false
}

export async function getAllBgmIDInAnimeTable() {
    // 获取 anime 表所有未删除番剧的 BgmID, 用于关联番剧的查找

    let allBgmID = await promiseDB.query('SELECT bgmid FROM anime WHERE deleted = 0')
    let idList = new Array()
    allBgmID[0].forEach(value => idList.push(parseInt(value.bgmid)))
    idList = _.compact(idList)
    return idList

}

export async function getAllBgmIdInBangumiDataTable() {
    // 获取 bangumi_data 表所有的 BgmID

    let allBgmID = await promiseDB.query('SELECT bgmid,update_time FROM bangumi_data')
    let idList = new Array();
    allBgmID[0].forEach(value => idList.push(parseInt(value.bgmid)))
    idList = _.compact(idList)
    return idList

}

export async function insertBgmIDToDB(bgmID) {
    /*
        插入 bgmID 到 bangumi_data, 会判断是否存在，若不存在会自动插入后更新数据
        将会在数据也获取完成并且插入后返回 resolve, 比较耗时
    */

    let isExist = await promiseDB.query('SELECT bgmid FROM bangumi_data WHERE bgmid = ?', [bgmID])
    isExist = isExist[0]
    if (isExist.length == 0) {
        promiseDB.query('INSERT INTO bangumi_data (`bgmid`) VALUES (?)', [bgmID])
        console.log(`[Bangumi Data] 插入 bgm${bgmID} 到 Bangumi Data`);
        await updateBangumiData(bgmID)
    }

}