import express from 'express';

import config from './common/config.js';
import db from './common/sql.js';

const app = express();
app.use(express.json()); // 使用 Express 4.16 自带的 .json() 中间件 , 使得全局的 req.body 自动解析为 JSON
app.use(express.urlencoded({ extended: true })) // 使用 Express 自带的 URLEncoded 中间件，使得全局的 URl 参数可以被自动解析
app.set('trust proxy', config.trustProxy) // 允许 Express 信任上级代理提供的 IP 地址

app.all('*', async (req, res, next) => {
    // 设置 Headers
    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT'
    })
    // 打印 Log
    let nowTime = new Date().toLocaleString(); // 获取当前时间
    let ref = req.get('Referer') || 'Referer 获取失败'
    console.log(`[传入请求] [${req.ip}] ${req.method} ${decodeURIComponent(req.url)} [${nowTime}] [${ref}]`);
    // 判断 Referer 限制
    if (config.refererWhiteList.length && config.refererWhiteList.indexOf(ref) == -1) {
        // 如果 Referer 白名单启用, 同时访问的 referer 又不在白名单中
        console.log('[安全提示] 非白名单中的来源访问了 API: ', req.get('user-agent'));
        return res.status(403).send({ code: 403, message: '' })
    }
    // 进行下一步
    next();
});

import index from './routes/v2/index.js'
import user from './routes/v2/user.js';
import anime from './routes/v2/anime.js'
import search from './routes/v2/search.js'
import home from './routes/v2/home.js'
import drive from './routes/v2/drive.js'
app.use(`/v2/index`, index); // 索引
app.use(`/v2/user`, user); // 用户
app.use('/v2/anime', anime) // 动画
app.use('/v2/search', search) // 搜索
app.use('/v2/home', home) // 主页相关
app.use('/v2/drive', drive) // 存储



const server = app.listen(8090, () => {
    console.log("[启动信息] 服务器已启动, 访问端口为: " + server.address().port)
})