import _ from "lodash";
import config from "../../../common/config.js";
import { promiseDB } from "../../../common/sql.js";


export async function simpleAnimeData(data) {
    /*
        传入 anime 表查询结果，自动解析为简单数据结构
        注意，返回的数据始终为数组
    */
    if (!data) throw new Error('No data provide')
    if (typeof data !== 'object') throw new Error('Data is not a Object')

    data = _.castArray(data) // 强制转为数组
    let bgmData = await getAllBangumiSubject(data); // 拿到 bgmID 和 BangumiData 的键值对
    let simpleAnimeDataResult = new Array() // 存储结果
    for (let i in data) {
        simpleAnimeDataResult.push(parseSingleAnimeData(data[i], bgmData))
    }

    return simpleAnimeDataResult

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


async function getAllBangumiSubject(data) {
    // 将从数据库的原始数据传入，返回 bgmID 所对应的 subject 数据键值对

    let bgmIdList = new Array(); // 本次传入的 bgmID 列表
    for (let i in data) {
        let thisBgmId = parseInt(data[i].bgmid);
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