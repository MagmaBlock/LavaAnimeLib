// 引用库
const express = require('express');
const bodyParser = require('body-parser');
const cron = require("node-cron"); // 定时任务
// 引用全局脚本
require('./common/sql');
// 创建服务器
const app = express();

app.use(express.json()); // 使用 Express 4 自带的 .json() , 使得全局可以使用 req.body
app.use(express.urlencoded({ extended: true }))

app.all('/*', async function (req, res, next) {
    res.header('Content-Type', 'application/json'); // 指定客户端请求的属性
    res.header('Access-Control-Allow-Origin', '*'); // 允许跨域
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT'); // 允许跨域
    let nowTime = new Date().toLocaleString(); // 获取当前时间
    let ip = req.ip
    if (req.headers['x-real-ip']) { // 兼容nginx代理
        ip = req.headers['x-real-ip']
    }
    console.log(`[传入请求] [${ip}] ${req.method} ${req.url} [${nowTime}]`);
    next();
});

app.use(`/v1/search`, require('./routes/search')); // 搜索
app.use(`/v1/view`, require('./routes/view')); // 播放量
app.use(`/v1/file`, require('./routes/file')); // 文件
app.use(`/v1/index`, require('./routes/index')); // 索引页
app.use(`/v1/zth`, require('./routes/zth')); // Zth API，和番剧库无关
app.use(`/v1/anime`, require('./routes/anime')); // 动画信息

const server = app.listen(8090, function () {
    console.log("[启动信息] 服务器已启动, 访问端口为: " + server.address().port)
})