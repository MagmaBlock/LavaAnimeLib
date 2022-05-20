export function getRelations(req, res) {
    let reqBgmId = req.params[0];
    if (reqBgmId) {
        if (isNaN(reqBgmId)) {
            let response = { code: 500, message: 'ID 不是数字' }
            res.send(JSON.stringify(response));
            console.error('[发送错误]', response);
            return;
        }
        db.query(
            'SELECT * FROM bangumi_data WHERE bgmid = ?',
            [reqBgmId],
            function (error, results) {
                if (results.length == 0) {
                    let response = { code: 204, message: '', data: [] };
                    res.send(JSON.stringify(response));
                }
                else {
                    let relationData = JSON.parse(results[0].relations_anime);
                    let response = { code: 200, message: '', data: relationData };
                    res.send(JSON.stringify(response));
                }
            }
        )
    }
    else {
        let response = { code: 500, message: '未提供 ID' }
        res.send(JSON.stringify(response));
    }
}