import { promiseDB } from "../../../common/sql.js"

export async function getAnimeByID(laID) {
    // 传入 ID 返回数据库查询结果
    if (!isFinite(laID)) throw new Error('ID 无法解析为数字或不存在')

    try {
        let anime = await promiseDB.query('SELECT * FROM anime WHERE id = ? AND deleted = 0', [laID])
        anime = anime[0]
        return anime
    } catch (error) {
        throw error
    }
}