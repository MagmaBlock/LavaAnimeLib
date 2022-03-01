const { textHandler } = require("./tools/textHandler");

function addView (req, res){
    viewsHandler(req, res, true);
}
function getView (req, res){
    viewsHandler(req, res, false);
}

function viewsHandler(req, res, update) { // 处理播放量请求

    let id = textHandler(req.params[0]); // 调用函数验证 ID
    if (id == undefined) { // 如果 ID 不正常，则返回错误
        let response = { code: 400, message: '提供的 ID 有误、不合法或未提供!', data: '' };
        res.send(JSON.stringify(response));
        console.log('[发送错误]', response);
    }
    else {
        getViews(id, update).then(result => { // 增加或查询播放量
            let response = { code: 0, message: 'success', data: result }
            res.send(JSON.stringify(response));
            if (update) {
                console.log('[新增播放]', response);
            }
        }).catch(error => {
            let response = { code: 400, message: error }
            res.send(JSON.stringify(response));
            console.error('[发送错误]', response);
        })
    }
}


// 新增播放量
function getViews(id, update) {
    return new Promise((resolve, reject) => {
        // 查询数据库中是否存在该 ID 的记录
        selectSql = `SELECT * FROM anime WHERE id = '${id}'`
        // console.log('[SQL查询]', selectSql);
        // 执行查询
        db.query(selectSql, function (error, results) {
            if (error) throw error;
            let thisAnime = results
            if (results.length == 0) { // 如果数据库未查询到该 ID 的记录
                reject('没有找到相关记录');
            }
            else { // 如果数据库查询到该 ID 的记录
                if (update) { // 如果需要更新播放量
                    let newViews = parseInt(results[0].views) + 1; // 新的播放量
                    updateSql = `UPDATE anime SET views = '${newViews}' WHERE id = '${id}'`
                    // console.log('[SQL查询]', updateSql);
                    db.query(updateSql, function (error, results) {
                        if (error) throw error;
                        else {
                            console.log(`[新增播放] 新增了播放量 [${thisAnime[0].id}] ${thisAnime[0].name} => ${newViews} !`); // 打印更新后的播放量
                            // console.log('[SQL返回]', results);
                            resolve(newViews) // 返回更新后的播放量
                        }
                    });
                }
                else {
                    resolve(parseInt(results[0].views)) // 返回播放量
                }
            }
        });
    })
}

module.exports = {
    addView,
    getView
}