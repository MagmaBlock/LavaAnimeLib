import db from '../../common/sql.js'

export function searchByBgmId(req, res) {
    res.send({
        code: 0, message: 'API 过时', data: [
            {
                "id": 1,
                "year": "year",
                "type": "type",
                "name": "当前客户端的 API 过期",
                "views": -1,
                "bgmid": "000000",
                "nsfw": 0,
                "title": "当前客户端的 API 过期",
                "deleted": 0,
                "poster": "https://anime-img.5t5.top/assets/noposter.png"
            }
        ]
    })
    console.warn('');
    console.warn('[V1 API] 意料之外的前端请求了 V1 View.', `\nReferer: ${req.get('Referer')}\nUA: ${req.get('user-agent')}`);
    console.warn('');
    return
    let id = req.params[0]; // 请求的ID
    db.query(
        `SELECT * FROM anime WHERE bgmid = ? AND deleted = 0 ORDER BY views DESC`,
        [id],
        function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                let response = { code: 0, message: 'success', data: results };
                res.send(JSON.stringify(response));
                console.log(`[搜索成功] 成功搜索 BgmID ${id}`);
            }
            else {
                let response = { code: 404, message: '没有找到相关记录', data: [] };
                res.send(JSON.stringify(response));
                console.log('[搜索无结果]', response);
            }
        }
    );
}

export function searchByName(req, res) {
    res.send({
        code: 0, message: 'API 过时', data: [
            {
                "id": 1,
                "year": "year",
                "type": "type",
                "name": "当前客户端的 API 过期",
                "views": -1,
                "bgmid": "000000",
                "nsfw": 0,
                "title": "当前客户端的 API 过期",
                "deleted": 0,
                "poster": "https://anime-img.5t5.top/assets/noposter.png"
            }
        ]
    })
    console.warn('');
    console.warn('[V1 API] 意料之外的前端请求了 V1 View.', `\nReferer: ${req.get('Referer')}\nUA: ${req.get('user-agent')}`);
    console.warn('');
    return
    let text = decodeURIComponent(req.params[0]); // 获取搜索内容
    if (text != '') {
        let splitTextList = text.split(' '); // 分割搜索内容
        let sqlQuery = `SELECT * FROM anime WHERE `; // 查询语句的头
        for (let i = 0; i < splitTextList.length; i++) { // 遍历搜索关键词列表
            splitTextList[i] = `%${splitTextList[i]}%`; // 为每个搜索关键词加上模糊查询
            sqlQuery = sqlQuery + `title LIKE ? AND `; // 拼接查询语句
        }
        sqlQuery = sqlQuery + 'deleted = 0 ORDER BY views DESC'; // 查询语句的尾巴
        db.query(
            sqlQuery,
            splitTextList,
            function (error, results) {
                if (error) throw error;
                if (results.length > 0) { // 搜索到了结果
                    let response = { code: 0, message: 'success', data: results };
                    res.send(JSON.stringify(response));
                    console.log(`[搜索成功] 成功搜索 '${text}'`);
                }
                else { // 没有搜索到结果
                    let response = { code: 404, message: '没有找到相关记录', data: [] };
                    res.send(JSON.stringify(response));
                    console.log('[发送错误]', response);
                }
            }
        );
    } else {
        let response = { code: 404, message: '搜索内容为空', data: [] };
        res.send(JSON.stringify(response));
        console.log('[发送错误]', response);
    }
}