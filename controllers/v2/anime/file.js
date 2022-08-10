import { AlistAPI } from "../../../common/api.js"
import config from "../../../common/config.js"
import { getAnimeByID } from "./get.js"

export async function getFilesByID(laID) {
    // 根据 ID 获取某番剧目录下的文件和文件夹名

    let anime = (await getAnimeByID(laID))[0]
    if (!anime) return false // 404

    let alistAPIResult = (await AlistAPI.post('/api/public/path', {
        path: config.alist.root + '/' + anime.year + '/' + anime.type + '/' + anime.name
    })).data

    if (alistAPIResult.code == 200) {
        let thisDir = new Array() // 存储解析后的文件列表结果
        let files = alistAPIResult.data.files
        for (let i in files) {
            let thisFile = files[i]
            let thisFileInfo = { // 当前文件的信息
                name: thisFile.name,
                size: thisFile.size,
                url: thisFile.url,
                updated: thisFile.updated_at,
                driver: thisFile.driver,
                thumbnail: thisFile.thumbnail,
            }
            if (thisFile.type == 1) { // 文件夹处理
                thisDir.push({
                    ...thisFileInfo,
                    type: 'dir'
                })
            } else {
                thisDir.push({
                    ...thisFileInfo,
                    type: 'file'
                })
            }
        }
        return thisDir
    } else {
        return false
    }

}