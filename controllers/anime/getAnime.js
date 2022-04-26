function getAnimeById(req, res) { // 根据id获取动画信息
    let reqId = req.params[0];
    if (isNaN(reqId)) {
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
        return;
    }

    db.query(
        'SELECT * FROM anime WHERE id = ?',
        [reqId],
        function (error, results) {
            if (results.length > 0) {
                let response = { code: 0, message: 'success', data: results[0] }
                res.send(JSON.stringify(response));
            }
            else {
                let response = { code: 204, message: 'no data', data: [] }
                res.send(JSON.stringify(response));
            }
        }
    )
}

function getAnimesByIds(req, res) { // 根据id获取动画信息, POST 批量获取
    let idList = req.body
    if (idList.length == 0) {
        let response = { code: 204, message: 'no data' }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
        return;
    }
    else{
        db.query(
            'SELECT * FROM anime WHERE id IN (?)',
            [idList],
            function (error, results) {
                if (results.length > 0) {
                    let response = { code: 0, message: 'success', data: results }
                    res.send(JSON.stringify(response));
                }
                else {
                    let response = { code: 204, message: 'no data', data: [] }
                    res.send(JSON.stringify(response));
                }
            }
        )
    }
}

function getAnimeByBgmID(req, res) { // 根据bgmid获取动画信息
    let reqBgmId = req.params[0];
    if (isNaN(reqBgmId)) {
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
        return;
    }

    db.query(
        'SELECT * FROM anime WHERE bgmid = ?',
        [reqBgmId],
        function (error, results) {
            if (results.length > 0) {
                let response = { code: 0, message: 'success', data: results }
                res.send(JSON.stringify(response));
            }
            else {
                let response = { code: 204, message: 'no data', data: [] }
                res.send(JSON.stringify(response));
            }
        }
    )
}

module.exports = {
    getAnimeById,
    getAnimesByIds,
    getAnimeByBgmID
}