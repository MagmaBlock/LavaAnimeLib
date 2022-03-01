// 引用库
const express = require('express');
// 引用全局脚本
require('./common/sql'); 
// 创建服务器
const app = express();

app.all('/*', async function (req, res, next) {
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    let nowTime = new Date().toLocaleString(); // 获取当前时间
    console.log(`[传入请求] [${req.headers['x-real-ip']}] ${req.method} ${req.url} [${nowTime}]`);
    next();
});

const searchRouter = require('./routes/search');
const viewRouter = require('./routes/view');
const fileRouter = require('./routes/file');
app.use(`/v1/search`, searchRouter);
app.use(`/v1/view`, viewRouter);
app.use(`/v1/file`, fileRouter);

const server = app.listen(8090, function () {
    console.log("[启动信息] 服务器已启动, 访问端口为: " + server.address().port)
})