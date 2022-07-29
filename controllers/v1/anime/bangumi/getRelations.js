import { dbQueryAsync } from "../../tools/dbQuery.js";

export async function getBangumiRelations(req, res) {
    let reqBgmId = req.params[0];
    if (reqBgmId) {
        if (isNaN(reqBgmId)) {
            let response = { code: 500, message: 'ID 不是数字' }
            res.send(JSON.stringify(response));
            console.error('[发送错误]', response);
            return;
        }
        let relations = await dbQueryAsync(
            'SELECT * FROM bangumi_data WHERE bgmid = ?',
            [reqBgmId]
        );
        if (relations.length == 0) { // DB 没有该 ID 的条目
            res.send({ code: 404, message: 'this bangumi id not found', data: [] });
            return;
        }
        relations = JSON.parse(relations[0].relations_anime); // 将 JSON 字符串转换为对象
        if (relations.length == 0) { // 该条目没有关联的番剧
            res.send({ code: 204, message: 'no relations', data: [] });
            return
        }
        if (relations.length != 0) { // 该条目有关联的番剧
            let relationsAnime = new Array();
            for (let i in relations) {
                let thisRelationInLib = await dbQueryAsync(
                    'SELECT * FROM anime WHERE bgmid = ?',
                    [relations[i].id]
                )
                for (let j in thisRelationInLib) {
                    // 现在会查找 anime 表中的数据，和 bangumi 这里的融合方便前端
                    relationsAnime.push({ ...relations[i], lavaAnime: thisRelationInLib[j] });
                }
            }
            res.send({ code: 0, message: 'success', data: relationsAnime });
        }

    }
    else {
        let response = { code: 500, message: '未提供 ID' }
        res.send(JSON.stringify(response));
    }
}