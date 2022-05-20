// 引用库
import express from 'express';
// import cron from 'node-cron'; // 定时任务
// 引用全局脚本
import db from './common/sql.js'; // 数据库连接模块
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

import search from './routes/search.js';
import view from './routes/view.js';
import index from './routes/index.js';
import zth from './routes/zth.js';
import anime from './routes/anime.js';
app.use(`/v1/search`, search); // 搜索
app.use(`/v1/view`, view); // 播放量
app.use(`/v1/index`, index); // 索引页
app.use(`/v1/zth`, zth); // Zth API，和番剧库无关
app.use(`/v1/anime`, anime); // 动画信息

const server = app.listen(8090, function () {
    console.log("[启动信息] 服务器已启动, 访问端口为: " + server.address().port)
})