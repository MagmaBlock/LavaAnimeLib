function searchByBgmId(req, res) {
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
                let response = { code: 404, message: '没有找到相关记录', data: '' };
                res.send(JSON.stringify(response));
                console.log('[搜索无结果]', response);
            }
        }
    );
}

function searchByName(req, res) {
    let text = decodeURIComponent(req.params[0]); // 获取搜索内容
    db.query(
        `SELECT * FROM anime WHERE title LIKE ? AND deleted = 0 ORDER BY views DESC`,
        [`%${text}%`],
        function (error, results) {
            if (error) throw error;
            if (results.length > 0) { // 搜索到了结果
                let response = { code: 0, message: 'success', data: results };
                res.send(JSON.stringify(response));
                console.log(`[搜索成功] 成功搜索 '${text}'`);
            }
            else { // 没有搜索到结果
                let response = { code: 404, message: '没有找到相关记录', data: '' };
                res.send(JSON.stringify(response));
                console.log('[发送错误]', response);
            }
        }
    )
}

module.exports = {
    searchByBgmId,
    searchByName
}