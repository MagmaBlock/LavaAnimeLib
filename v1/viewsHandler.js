const { idHandler } = require("./idHandler");

function viewsHandler(req, res, update) { // 处理点击量请求

    let id = idHandler(req.params[0]); // 调用函数验证 ID
    if (id == undefined) { // 如果 ID 不正常，则返回错误
        let response = { code: 400, message: '提供的 ID 有误、不合法或未提供!', data: '' };
        res.send(JSON.stringify(response));
        console.log('[发送错误]', response);
    }
    else {
        getViews(id, update).then(result => { // 增加或查询点击量
            let response = { code: 0, message: 'success', data: result }
            res.send(JSON.stringify(response));
            console.log('[发送数据]', response);
        }).catch(error => {
            let response = { code: 400, message: error }
            res.send(JSON.stringify(response));
            console.error('[发送错误]', response);
        })
    }

}



// 新增点击量
function getViews(id, update) {
    return new Promise((resolve, reject) => {
        // 查询数据库中是否存在该 ID 的记录
        selectSql = `SELECT * FROM anime WHERE id = '${id}'`
        // console.log('[SQL查询]', selectSql);
        // 执行查询
        connection.query(selectSql, function (error, results) {
            if (error) throw error;
            // console.log('[SQL返回] 目前访问: ', results);
            if (results.length == 0) { // 如果数据库未查询到该 ID 的记录
                reject('没有找到相关记录');
            }
            else { // 如果数据库查询到该 ID 的记录
                if (update) { // 如果需要更新点击量
                    let newViews = parseInt(results[0].views) + 1; // 新的点击量
                    // console.log(`[更新成功] 更新为 ${newViews} !`); // 打印更新后的点击量
                    updateSql = `UPDATE anime SET views = '${newViews}' WHERE id = '${id}'`
                    // console.log('[SQL查询]', updateSql);
                    connection.query(updateSql, function (error, results) {
                        if (error) throw error;
                        else {
                            // console.log('[SQL返回]', results.message);
                            resolve(newViews) // 返回更新后的点击量
                        }
                    });
                }
                else {
                    resolve(parseInt(results[0].views)) // 返回点击量
                }
            }
        });
    })
}

module.exports = viewsHandler;