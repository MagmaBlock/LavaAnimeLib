import alistGetter from "./tools/alistGetter.js";
import _ from "lodash";
import { promiseDB } from "../../common/sql.js";


export default async function updateAnimes() {

    // 用于存储本次入库的番剧列表
    let allNewAnimes = new Array();

    // 获取年列表
    let allYears = await getYears();
    console.log(`[番剧更新] 获取到 ${allYears.length} 个年份`);

    // 获取每个年下的分类
    for (let i in allYears) {
        let thisYear = allYears[i]
        let allTypes = await getTypes(thisYear);

        // 获取每个分类下的番剧
        for (let j in allTypes) {
            let thisType = allTypes[j]
            let allAnimes = await getAnimes(thisYear, thisType);
            console.log(`[番剧更新] 成功获取 ${thisYear} ${thisType}`);

            // 获取数据库中本分类的番剧
            let allDBAnimes = await getThisTypeDB(thisYear, thisType);
            let newAnimes = _.difference(allAnimes, allDBAnimes) // 获取左边数组比右边数组多出的部分，即找 Alist 新增
            allNewAnimes = _.concat(allNewAnimes, newAnimes)

            // console.log(newAnimes);

            for (let k in newAnimes) {
                let thisAnime = newAnimes[k]
                let isNew = await isNewInDB(thisYear, thisType, thisAnime);
                let isDeleted = await isDeletedInDB(thisYear, thisType, thisAnime);

                if (isNew, !isDeleted) { // 新资源
                    insertAnimeToDB(thisYear, thisType, thisAnime)
                    console.log(`[番剧更新] 新入库 ${thisYear, thisType, thisAnime}`);
                }
                if (!isNew, isDeleted) { // 被删除的资源

                }
            }

        }

    }

    console.log(allNewAnimes);


}

updateAnimes()

async function getYears() {

    // 获取根目录
    let rootDir = await alistGetter()
    if (rootDir.code == 200) rootDir = rootDir.data.files
    else throw new Error('Alist API 异常')

    let allYears = new Array()
    for (let i in rootDir) {
        if (rootDir[i].type == 1) allYears.push(rootDir[i].name)
    }

    return allYears
}

async function getTypes(year) {

    // 获取年的目录
    let yearDir = await alistGetter('/1A/LavaAnimeLib/' + year)
    if (yearDir.code == 200) yearDir = yearDir.data.files
    else throw new Error('Alist API 异常')

    let thisYearTypes = new Array()
    for (let i in yearDir) {
        if (yearDir[i].type == 1) thisYearTypes.push(yearDir[i].name)
    }

    return thisYearTypes
}

async function getAnimes(year, type) {

    // 获取相应年和分类目录
    let typeDir = await alistGetter('/1A/LavaAnimeLib/' + year + '/' + type)
    if (typeDir.code == 200) typeDir = typeDir.data.files
    else throw new Error('Alist API 异常')

    let thisTypeAnimes = new Array()
    for (let i in typeDir) {
        if (typeDir[i].type == 1) thisTypeAnimes.push(typeDir[i].name)
    }

    return thisTypeAnimes
}

async function getThisTypeDB(year, type) {

    // 从数据库查询此分类有什么番剧
    let thisTypeAnimes = await promiseDB.query('SELECT name FROM anime WHERE `year` LIKE ? AND `type` LIKE ? AND deleted = \'0\'', [year, type])
    let allDBAnimes = new Array();
    thisTypeAnimes[0].forEach(anime => allDBAnimes.push(anime.name))

    return allDBAnimes

}

async function isNewInDB(year, type, name) {

    let isNew = await promiseDB.query('SELECT * FROM anime WHERE `year` LIKE ? AND `type` LIKE ? AND `name` LIKE ?', [year, type, name])
    isNew = isNew[0]
    if (isNew.length == 0) return true; // 如果数据库内找不到此动画为真
    if (isNew.length !== 0) return false; // 如果找到此动画为假（也可能是在数据库中被标记为 deleted 的资源）

}

async function isDeletedInDB(year, type, name) {

    let isDeleted = await promiseDB.query('SELECT * FROM anime WHERE `year` LIKE ? AND `type` LIKE ? AND `name` LIKE ? AND deleted = 1', [year, type, name])
    isDeleted = isDeleted[0]
    if (isDeleted.length !== 0) return true // 如果数据库找到被删除的此动画为真
    if (isDeleted.length == 0) return false // 如果数据库找不到已经被删除的此动画为假

}

async function insertAnimeToDB(year, type, name) {

    let bgmID = name.match("\\d+$")[0];
    let title = name.replace(bgmID, '').trim()
    promiseDB.query('INSERT INTO anime (`year`, `type`, `name`, `bgmid`, `title`) VALUES (?, ?, ?, ?, ?)', [year, type, name, bgmID, title])

    insertBgmIDToDB(bgmID)

}

async function insertBgmIDToDB(bgmID) {

    let isExist = await promiseDB.query('SELECT bgmid FROM bangumi_data WHERE bgmid = ?', [bgmID])
    isExist = isExist[0]
    if (isExist.length == 0) {
        promiseDB.query('INSERT INTO bangumi_data (`bgmid`) VALUES (?)', [bgmID])
    }

}