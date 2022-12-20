import { promiseDB } from "../../../common/sql.js"
import { getAnimeByID } from "./get.js"
import { parseFileName } from "./tag.js"

export async function getAnimeView(laID) {
    // 传入 ID 并返回播放量
    if (!isFinite(laID)) throw new Error('ID 无法解析为数字或不存在')

    try {
        let anime = await getAnimeByID(laID)
        if (anime.length) {
            let view = parseInt(anime[0].views)
            return view
        } else {
            return false
        }
    } catch (error) {
        throw error
    }
}

// 增加播放量的工具函数
export async function addAnimeView(laID, file, type, ip, userID) {
    if (!isFinite(laID)) throw new Error('ID 无法解析为数字或不存在')

    // 更新 anime 表播放量
    try {
        let addQuery = await promiseDB.query('UPDATE anime SET views = views + 1 WHERE id = ? AND deleted = 0', [laID])
        if (addQuery[0].changedRows == 0) return false // 如果是 0 说明找不到此作品
    } catch (error) {
        return false
    }

    let episode = parseFileName(file).episode || ''

    // 插入 views 表记录
    try {
        promiseDB.query(
            'INSERT INTO views (id,ep,file,ip,`user`,`type`) VALUES (?,?,?,?,?,?)',
            [laID, episode, file, ip, userID, type]
        )
    } catch (error) {
        console.error(error);
        console.log('成功添加播放量后插入 view log 失败');
    }
    return true
}