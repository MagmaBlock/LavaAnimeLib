import config from "../../common/config.js";
import { promiseDB } from "../../common/sql.js";
import { getAllBgmIDInAnimeTable } from "./bangumiDB.js";

export async function updatePosters() {
    let allBgmIDInAnime = await getAllBgmIDInAnimeTable()
    let allSubjectsData = await promiseDB.query('SELECT bgmid,subjects FROM bangumi_data WHERE bgmid IN (?)', [allBgmIDInAnime])
    allSubjectsData = allSubjectsData[0]
    let newArray = {}
    for (let i in allSubjectsData) {
        newArray[allSubjectsData[i].bgmid] = JSON.parse(allSubjectsData[i].subjects)
    }
    allSubjectsData = newArray

    for (let i in allBgmIDInAnime) {
        try {
            if (allSubjectsData[allBgmIDInAnime[i]].images && allSubjectsData[allBgmIDInAnime[i]]) {
                let thisPoster = allSubjectsData[allBgmIDInAnime[i]].images.large.replace('https://lain.bgm.tv', config.bangumiImage.host) + '/poster' || ''
                promiseDB.query(
                    'UPDATE anime SET poster = ? WHERE bgmid = ?',
                    [thisPoster, allBgmIDInAnime[i]]
                )
                console.log(`[Poster 更新] ${allBgmIDInAnime[i]} => ${thisPoster}`);
            } else {
                promiseDB.query(
                    'UPDATE anime SET poster = ? WHERE bgmid = ?',
                    ['https://anime-img.5t5.top/assets/noposter.png', allBgmIDInAnime[i]]
                )
                console.log(`[Poster 更新] 无图片的 ${allBgmIDInAnime[i]} => https://anime-img.5t5.top/assets/noposter.png`);
            }
        } catch (error) {
            console.error(error)
        }
    }
}