// npm
import express from 'express';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
// routers
import index from './routes/v2/index.js'
import user from './routes/v2/user.js';
import anime from './routes/v2/anime.js'
import search from './routes/v2/search.js'
import home from './routes/v2/home.js'
import drive from './routes/v2/drive.js'
// modules
import config from './common/config.js';
import db from './common/sql.js';
import { inRefererWhiteList } from './common/tools/referer.js';
import { logger } from './common/tools/logger.js';
import { useToken } from './controllers/v2/user/token.js';
import { findUserByID } from './controllers/v2/user/findUser.js';

// 创建 app
const app = express();
// 中间件和设置
app.use(express.json()); // 使用 Express 4.16 自带的 .json() 中间件 , 使得全局的 req.body 自动解析为 JSON
app.use(express.urlencoded({ extended: true })) // 使用 Express 自带的 URLEncoded 中间件，使得全局的 URl 参数可以被自动解析
app.set('trust proxy', config.security.trustProxy) // 允许 Express 信任上级代理提供的 IP 地址
app.use(cookieParser()) // cookie 处理器
// 全局请求前置
app.all('*', async (req, res, next) => {
    let queryStart = new Date()
    // 设置 Headers
    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT'
    })

    // 尝试验证登录
    let authHeader = req.get('Authorization')
    if (authHeader) {
        let userID = await useToken(authHeader)
        if (userID) {
            req.user = await findUserByID(userID)
            /*
                req.user = {
                    id: Number, email: String,
                    name: String, password: String,
                    create_time: Date,
                    data: { permission: { admin: Boolean } },
                    settings: Object,
                    expirationTime: Date (如果是从缓存中读取，此项存在)
                }
            */
        }
    }

    let ref = req.get('Referer') || '无 Referer'
    // 如果不在 Referer 白名单中
    if (!inRefererWhiteList(ref)) {
        logger(
            '未知 Referer, 来自客户端 UA: ',
            chalk.dim(req.get('user-agent'))
        );
        return res.status(403).send({ code: 403, message: '' })
    }
    // 进行下一步
    next();
    res.once('finish', () => {
        if (req.method == 'OPTIONS') return // 不打印 OPTIONS 相关 log
        // 打印 Log
        logger(
            chalk.dim(req.ip),
            req.user ? chalk.dim(req.user.name) : chalk.cyan('访客'),
            chalk.bgGreenBright(' ' + req.method + ' '),
            decodeURIComponent(req.originalUrl),
            chalk.dim(ref),
            chalk.dim(new Date - queryStart, 'ms')
        );
    })
});

// use routers
app.use(`/v2/index`, index); // 索引
app.use(`/v2/user`, user); // 用户
app.use('/v2/anime', anime) // 动画
app.use('/v2/search', search) // 搜索
app.use('/v2/home', home) // 主页相关
app.use('/v2/drive', drive) // 存储

// 启动服务器
const server = app.listen(8090, () => {
    logger("服务器已启动, 访问端口为: " + server.address().port)
})