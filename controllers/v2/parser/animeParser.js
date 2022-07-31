import config from "../../../common/config.js";
import { promiseDB } from "../../../common/sql.js";


export async function simpleAnimeData(data) { // 解析为简单番剧数据
    if (!data) throw new Error('No data provide')
    if (typeof data == 'object') { // 判断是否为对象

        let bgmData = await getAllBangumiSubject(data);
        let simpleAnimeDataResult // 结果

        // 生成新结构
        if (Array.isArray(data)) { // 判断是否为数组
            // Array
            simpleAnimeDataResult = new Array()
            for (let i in data) {
                simpleAnimeDataResult.push(parseSingleAnimeData(data[i], bgmData))
            }
            return simpleAnimeDataResult
        } else {
            // Object (只有一个)
            simpleAnimeDataResult = parseSingleAnimeData(data[i], bgmData)
            return simpleAnimeDataResult
        }


    } else { throw new Error('Data is not a Object') }
}

function parseSingleAnimeData(data, bgmData) {
    if (parseInt(data.bgmid)) {
        let thisSubject = bgmData[data.bgmid]
        for (let i in thisSubject.images) {
            thisSubject.images[i] = thisSubject.images[i].replace('https://lain.bgm.tv', config.bangumiImage.host)
        }

        let thisAnimeData = {
            id: parseInt(data.id),
            index: {
                year: data.year,
                type: data.type,
                name: data.name,
            },
            views: data.views,
            bgmId: parseInt(data.bgmid),
            title: data.title.replace(/\[BDRip\]|\[NSFW\]/gi, ''),
            tags: {
                bdrip: data.title.match(/\[BDRip\]/i) ? true : false,
                nsfw: data.title.match(/\[NSFW\]/i) ? true : false
            },
            images: {
                ...thisSubject.images,
                poster: thisSubject.images.large + '/poster'
            },
            rating: thisSubject.rating
        }

        return thisAnimeData
    }
    if (!parseInt(data.bgmid)) { // 非 Bangumi 番剧
        let thisAnimeData = {
            id: parseInt(data.id),
            index: {
                year: data.year,
                type: data.type,
                name: data.name,
            },
            views: data.views,
            bgmId: parseInt(data.bgmid),
            title: data.title.replace(/\[BDRip\]|\[NSFW\]/gi, ''),
            tags: {
                bdrip: data.title.match(/\[BDRip\]/i) ? true : false,
                nsfw: data.title.match(/\[NSFW\]/i) ? true : false
            },
            images: {
                small: data.poster,
                grid: data.poster,
                large: data.poster,
                medium: data.poster,
                common: data.poster,
                poster: data.poster
            },
            rating: {
                "rank": -1,
                "total": -1,
                "count": {
                    "1": 0,
                    "2": 0,
                    "3": 0,
                    "4": 0,
                    "5": 0,
                    "6": 0,
                    "7": 0,
                    "8": 0,
                    "9": 0,
                    "10": 0
                },
                "score": -1
            }
        }

        return thisAnimeData
    }
}


// 将从数据库内查询的含有 bgmid 的数组+对象 / 对象传入，返回每个对象所对应的 subject 数据合集
async function getAllBangumiSubject(data) {
    // 收集 data 中的 Bangumi ID
    let bgmIdList = new Array(); // 缓存全部 Bangumi ID 一次性批量查询数据库
    if (Array.isArray(data)) { // 判断是否为数组
        // Array
        for (let i in data) {
            let thisBgmId = parseInt(data[i].bgmid);
            if (thisBgmId) bgmIdList.push(thisBgmId)
        }
    } else {
        // Object (只有一个)
        let thisBgmId = parseInt(data.bgmid);
        if (thisBgmId) bgmIdList.push(thisBgmId)
    }


    // 查询上方收集的 Bangumi 对应的 Subject 数据
    let bgmData = {} // 存储 Bangumi Subject 数据的对象，使用 BgmID 为 Key 就能拿到
    if (bgmIdList.length > 0) {
        let queryResult = await promiseDB.query(
            'SELECT subjects FROM bangumi_data WHERE bgmid IN (?)',
            [bgmIdList]
        )
        queryResult = queryResult[0]
        for (let i in queryResult) {
            let thisSubjectData = JSON.parse(queryResult[i].subjects)
            bgmData[thisSubjectData.id] = thisSubjectData
        }
    }
    return bgmData
}