const express = require('express');
const app = express();
const mysql = require('mysql');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

function handleError(err) {
    if (err) {  // 如果是连接断开，自动重新连接
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { connect() }
        else { console.error(err.stack || err) }
    }
}

function connect() {
    connection = mysql.createConnection(config);
    connection.connect(handleError);
    connection.on('error', handleError);
}

connect()

app.get(`/v1/view/add/*`, (req, res) => { // 新增点击量
    try {
        viewsHandler(req, res, true)
    } catch (error) {
        console.error(error);
    }
});

app.get('/v1/view/get/*', (req, res) => { // 查询点击量
    try {
        viewsHandler(req, res, false)
    } catch (error) {
        console.error(error);
    }
})


function viewsHandler(req, res, update) { // 处理点击量请求
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, X-Requested-By, If-Modified-Since, X-File-Name, X-File-Type, Cache-Control, Origin");
    res.header("access-control-allow-methods", "*")
    res.header("Access-Control-Allow-Credentials", "true")
    res.header("Content-Type", "application/json");

    let nowTime = new Date().toLocaleString(); // 获取当前时间
    console.log('=================================');
    console.log(`[传入请求] ${req.ip} ${req.method} ${req.url} [${nowTime}]`);

    let id = idHandler(req, res) // 调用函数取得 ID
    if (id == 'undefined') { // 如果 ID 不正常，则返回错误
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

function idHandler(req) {

    let id = req.params[0] // 从请求中获取参数
    if (id == '') { // 处理没有指定 ID 的情况
        return id = 'undefined'
    }
    else {
        let id = req.params[0].match(/^[A-Za-z0-9]+$/); // 去除非法字符
        if (id) { id = id.toString() } // 将数组转换为字符串
        console.log('[解析参数]', req.params, '==>', id);
        if (!id || id.length > 12) { // 如果 ID 中有非法字符或太长
            return id = 'undefined'
        }
        if (id.match(/DROP|SELECT|DISTINCT|WHERE|AND|OR|INSERT|UPDATE|DELETE/gi)) {
            console.error('[异常警告]', '请求中包含SQL关键字');
            return id = 'undefined'
        }
        else {
            return id;
        }
    }
}




// 新增点击量
function getViews(id, update) {
    return new Promise((resolve, reject) => {
        // 查询数据库中是否存在该 ID 的记录
        selectSql = `SELECT * FROM anime WHERE id = '${id}'`
        console.log('[SQL查询]', selectSql);
        // 执行查询
        connection.query(selectSql, function (error, results) {
            if (error) throw error;
            console.log('[SQL返回] 目前访问: ', results);
            if (results.length == 0) { // 如果数据库未查询到该 ID 的记录
                reject('没有找到相关记录');
            }
            else { // 如果数据库查询到该 ID 的记录
                if (update) { // 如果需要更新点击量
                    let newViews = parseInt(results[0].views) + 1; // 新的点击量
                    console.log(`[更新成功] 更新为 ${newViews} !`); // 打印更新后的点击量
                    updateSql = `UPDATE anime SET views = '${newViews}' WHERE id = '${id}'`
                    console.log('[SQL查询]', updateSql);
                    connection.query(updateSql, function (error, results) {
                        if (error) throw error;
                        else {
                            console.log('[SQL返回]', results.message);
                            resolve(newViews) // 返回更新后的点击量
                        }
                    });
                }
                else {
                    resolve(results[0].views) // 返回点击量
                }
            }
        });
    })
}

const server = app.listen(8090, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("应用实例，访问地址为 http://localhost:" + port)
})