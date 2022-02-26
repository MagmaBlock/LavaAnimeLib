const { idHandler, textHandler } = require('./idHandler');

function searchByBgmId(req, res) {
    let id = idHandler(req.params[0]); // 验证ID
    if (id == undefined) { // 如果ID不正常，则返回错误
        let response = { code: 400, message: '提供的ID有误、不合法或未提供!', data: '' };
        res.send(JSON.stringify(response));
        console.log('[发送错误]', response);
    }
    else {
        connection.query(`SELECT * FROM anime WHERE bgmid = '${id}'`, function (error, results) {
            if (error) throw error;
            if (results.length == 0) { // 如果数据库未查询到该 ID 的记录
                let response = { code: 404, message: '没有找到相关记录', data: '' };
                res.send(JSON.stringify(response));
                console.log('[发送错误]', response);
            }
            else { // 如果数据库查询到该 ID 的记录
                let response = { code: 0, message: 'success', data: results };
                res.send(JSON.stringify(response));
                // console.log('[发送数据]', response);
                console.log(`[操作成功] 成功搜索 BgmID ${id}`);
            }
        });
    }
}

function searchByName(req, res) {
    let text = textHandler(decodeURIComponent(req.params[0])); // 验证ID
    if (text == undefined) { // 如果ID不正常，则返回错误
        let response = { code: 400, message: '提供的ID有误、不合法或未提供!', data: '' };
        res.send(JSON.stringify(response));
        console.log('[发送错误]', response);
    }
    else {
        connection.query(`SELECT * FROM anime WHERE title LIKE '%${text}%'`, function(error, results) {
            if (error) throw error;
            if (results.length == 0) { // 如果数据库未查询到该 ID 的记录
                let response = { code: 404, message: '没有找到相关记录', data: '' };
                res.send(JSON.stringify(response));
                console.log('[发送错误]', response);
            }
            else {
                let response = { code: 0, message: 'success', data: results };
                res.send(JSON.stringify(response));
                // console.log('[发送数据]', response);
                console.log(`[操作成功] 成功搜索 ${text}`);
            }
        })
    }
}

module.exports = {
    searchByBgmId,
    searchByName
}