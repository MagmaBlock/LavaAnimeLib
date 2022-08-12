import express from 'express';

import config from './common/config.js';
import db from './common/sql.js';

const app = express();
app.use(express.json()); // 使用 Express 4.16 自带的 .json() 中间件 , 使得全局的 req.body 自动解析为 JSON
app.use(express.urlencoded({ extended: true })) // 使用 Express 自带的 URLEncoded 中间件，使得全局的 URl 参数可以被自动解析
app.set('trust proxy', config.trustProxy) // 允许 Express 信任上级代理提供的 IP 地址

app.all('*', async (req, res, next) => {
    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT'
    })
    let nowTime = new Date().toLocaleString(); // 获取当前时间
    console.log(`[传入请求] [${req.ip}] ${req.method} ${req.url} [${nowTime}]`);
    next();
});

import search1 from './routes/v1/search.js';
import view1 from './routes/v1/view.js';
import index1 from './routes/v1/index.js';
import zth1 from './routes/v1/zth.js';
import anime1 from './routes/v1/anime.js';
app.use(`/v1/search`, search1); // 搜索
app.use(`/v1/view`, view1); // 播放量
app.use(`/v1/index`, index1); // 索引页
app.use(`/v1/zth`, zth1); // Zth API，和番剧库无关
app.use(`/v1/anime`, anime1); // 动画信息

import index2 from './routes/v2/index.js'
import user2 from './routes/v2/user.js';
import anime2 from './routes/v2/anime.js'
import search2 from './routes/v2/search.js'
app.use(`/v2/index`, index2); // 索引
app.use(`/v2/user`, user2); // 用户
app.use('/v2/anime', anime2) // 动画
app.use('/v2/search', search2) // 搜索



const server = app.listen(8090, () => {
    console.log("[启动信息] 服务器已启动, 访问端口为: " + server.address().port)
})