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
    let ip = req.ip
    if (req.headers['x-real-ip']){ // 兼容nginx代理
        ip = req.headers['x-real-ip']
    }
    console.log(`[传入请求] [${ip}] ${req.method} ${req.url} [${nowTime}]`);
    next();
});

const searchRouter = require('./routes/search');
const viewRouter = require('./routes/view');
const fileRouter = require('./routes/file');
const indexRouter = require('./routes/index');
app.use(`/v1/search`, searchRouter); // 搜索
app.use(`/v1/view`, viewRouter); // 播放量
app.use(`/v1/file`, fileRouter); // 文件
app.use(`/v1/index`, indexRouter); // 索引页

const server = app.listen(8090, function () {
    console.log("[启动信息] 服务器已启动, 访问端口为: " + server.address().port)
})