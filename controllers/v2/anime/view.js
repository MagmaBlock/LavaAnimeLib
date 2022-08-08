import { promiseDB } from "../../../common/sql.js"
import { getAnimeByID } from "./get.js"

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

export async function addAnimeView(laID, ep, file, ip, userID) {
    if (!isFinite(laID)) throw new Error('ID 无法解析为数字或不存在')

    let addQuery = await promiseDB.query('UPDATE anime SET views = views + 1 WHERE id = ? AND deleted = 0', [laID])
    if (addQuery[0].changedRows == 0) return false // 如果是 0 说明找不到此作品

    try {
        promiseDB.query('INSERT INTO views (id,ep,file,ip,`user`) VALUES (?,?,?,?,?)', [laID, ep, file, ip, userID])
    } catch (error) {
        console.error(error);
        console.log('成功添加播放量后插入 view log 失败');
    }
    return true
}