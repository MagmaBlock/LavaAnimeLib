export function getAnimeById(req, res) { // 根据id获取动画信息
    let reqId = req.params[0];
    if (isNaN(reqId)) {
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(response);
        console.error('[发送错误]', response);
        return;
    }

    db.query(
        'SELECT * FROM anime WHERE id = ? AND deleted = 0',
        [reqId],
        function (error, results) {
            if (results.length > 0) {
                let response = { code: 0, message: 'success', data: results[0] }
                res.send(response);
            }
            else {
                let response = { code: 204, message: 'no data', data: [] }
                res.send(response);
            }
        }
    )
}

export function getAnimesByIds(req, res) { // 根据id获取动画信息, POST 批量获取
    if ((req.body).length == undefined) {
        let response = { code: 400, message: 'bad request' }
        res.send(response);
        console.error('[发送错误]', response);
        return;
    }
    let idList = req.body; // 接收到的 id 列表
    if (idList.length == 0) { // 如果没有 id , 则返回 error
        let response = { code: 204, message: 'no data' }
        res.send(response);
        console.error('[发送错误]', response);
        return;
    }
    else {
        db.query(
            'SELECT * FROM anime WHERE id IN (?) AND deleted = 0 ORDER BY views DESC',
            [idList],
            function (error, results) {
                if (results.length > 0) {
                    let response = { code: 0, message: 'success', data: results }
                    res.send(response);
                }
                else {
                    let response = { code: 204, message: 'no data', data: [] }
                    res.send(response);
                }
            }
        )
    }
}

export function getAnimeByBgmID(req, res) { // 根据bgmid获取动画信息
    let reqBgmId = req.params[0];
    if (isNaN(reqBgmId)) {
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(response);
        console.error('[发送错误]', response);
        return;
    }

    db.query(
        'SELECT * FROM anime WHERE bgmid = ? AND deleted = 0 ORDER BY views DESC',
        [reqBgmId],
        function (error, results) {
            if (results.length > 0) {
                let response = { code: 0, message: 'success', data: results }
                res.send(response);
            }
            else {
                let response = { code: 204, message: 'no data', data: [] }
                res.send(response);
            }
        }
    )
}
