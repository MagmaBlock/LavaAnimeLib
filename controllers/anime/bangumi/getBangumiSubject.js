import { dbQueryAsync } from "../../tools/dbQuery.js";


export async function getBangumiSubjects(req, res) {
    let reqBgmId = req.params[0];
    if (!reqBgmId || isNaN(reqBgmId)) { // 如果没有提供 ID 或者 ID 不是数字
        res.send({ code: 500, message: 'ID 不是数字或不合法' });
        return;
    }
    let bangumiSubject = await dbQueryAsync(
        'SELECT subjects FROM bangumi_data WHERE bgmid = ?',
        [reqBgmId]
    )
    if (bangumiSubject.length == 0) { // DB 没有该 ID 的条目
        res.send({ code: 404, message: 'this bangumi id not found', data: {} });
        return;
    }
    res.send({ code: 200, message: 'success', data: JSON.parse(bangumiSubject[0].subjects) });
}