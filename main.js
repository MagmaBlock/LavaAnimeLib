// 引用库
const express = require('express');
const app = express();
const mysql = require('mysql');
const fs = require('fs');
// 引用模块
const viewsHandler = require('./v1/viewsHandler');
const search = require('./v1/search');
// 读取设置
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
// 连接数据库
function handleError(err) {
    if (err) {  // 自动重新连接
        console.error(err.stack || err);
        setTimeout(() => {
            connect();
        }, 5000);
    }
}
function connect() {
    connection = mysql.createConnection(config);
    connection.connect(handleError);
    connection.on('error', handleError);
}
connect()

app.all('/*', async function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json');
    let nowTime = new Date().toLocaleString(); // 获取当前时间
    console.log(`[传入请求] [${req.headers['x-real-ip']}] ${req.method} ${req.url} [${nowTime}]`);
    next();
});

app.get(`/v1/search/bgm/*`, (req, res) => { // 以 Bangumi ID 搜索
    try {
        search.searchByBgmId(req, res);
    } catch (error) {
        console.error(error);
    }
})

app.get(`/v1/search/name/*`, (req, res) => { // 以名称搜索
    try {
        search.searchByName(req, res);
    } catch (error) {
        console.error(error)
    }
})

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

const server = app.listen(8090, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("应用实例，访问地址为 http://localhost:" + port)
})