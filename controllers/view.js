const { textHandler } = require("./tools/textHandler");

function addView(req, res) {
    viewsHandler(req, res, true);
}
function getView(req, res) {
    viewsHandler(req, res, false);
}

function viewsHandler(req, res, update) { // 处理播放量请求
    let id = req.params[0]; // 客户端请求的 ID
    if (isNaN(id)) { // 如果 ID 不是数字
        let response = { code: 400, message: 'ID 不是数字' }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
        return;
    }

    getViews(id, update).then(result => { // 增加或查询播放量
        let response = { code: 0, message: 'success', data: result }
        res.send(JSON.stringify(response));
        if (update) {
            console.log('[新增播放]', response);
        }
    }).catch(error => {
        let response = { code: 404, message: error }
        res.send(JSON.stringify(response));
        console.error('[发送错误]', response);
    })
}



// 新增播放量
function getViews(id, update) {
    return new Promise((resolve, reject) => {
        // 查询数据库中是否存在该 ID 的记录
        // 执行查询
        db.query(
            `SELECT * FROM anime WHERE id = ? AND deleted = 0`,
            [id],
            function (error, results) {
                if (error) throw error;
                let thisAnime = results;
                console.log(thisAnime);
                if (thisAnime.length == 0) { // 如果数据库未查询到该 ID 的记录
                    reject('没有找到相关记录');
                }
                else { // 如果数据库查询到该 ID 的记录
                    if (update) { // 如果需要更新播放量
                        let newViews = parseInt(results[0].views) + 1; // 新的播放量
                        db.query(
                            'UPDATE anime SET views = ? WHERE id = ? AND deleted = 0',
                            [newViews, id],
                            function (error, results) {
                                if (error) throw error;
                                console.log(`[新增播放] 新增了播放量 [${thisAnime[0].id}] ${thisAnime[0].name} => ${newViews} !`); // 打印更新后的播放量
                                resolve(newViews) // 返回更新后的播放量
                            });
                    }
                    else {
                        resolve(parseInt(results[0].views)) // 返回播放量
                    }
                }
            }
        );
    })
}

module.exports = {
    addView,
    getView
}